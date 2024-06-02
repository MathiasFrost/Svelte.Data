import { indefinitePromise } from "$lib/async";
import { type Readable, type Subscriber, type Invalidator, type Unsubscriber, writable, type Writable, get } from "svelte/store";
import { cloneViaSerialization } from "$lib";
import { deserialize, formDataToObject } from "$lib/http/Deserializable";
import type { Deserializer } from "$lib/types/unknown";

/** TODOC */
export interface SvelteSagaData<T> {
	/** The actual value of the saga. Is undefined when no valid response has been returned from getter */
	readonly value: T | undefined;

	/** True if first getter resulting in a valid response has not been invoked and resolved */
	readonly pending: boolean;

	/** Either the promise or the resolved value depending on whether refresh/start was called with silent as true */
	readonly maybePromise: Promise<T> | T;

	/** Promise from getter. Note that this will not update on refresh/start when silent is true */
	readonly promise: Promise<T>;

	/** Error thrown from getter. Null if no error. */
	readonly error: Error | null;

	/** Messages to display to user relating to saga for convenience */
	readonly messages: Record<string, { verbosity: "info" | "warn" | "error"; message: string }>;
}

/** TODOC */
export class SvelteSagaBuilder<T> {
	private milliseconds: number = 0;
	private cooldownMilliseconds: number = 0;
	private silentRefreshInterval: boolean = true;
	private getter: (signal: AbortSignal) => Promise<T> | T = () => indefinitePromise<T>();

	public withRefreshInterval(milliseconds: number, silent = true): this {
		this.milliseconds = milliseconds;
		this.silentRefreshInterval = silent;
		return this;
	}

	public withRefreshCooldown(milliseconds: number): this {
		this.cooldownMilliseconds = milliseconds;
		return this;
	}

	public withGetter(getter: (signal: AbortSignal) => Promise<T> | T): this {
		this.getter = getter;
		return this;
	}

	public toSaga(): SvelteSaga<T> {
		return new SvelteSaga<T>(this.getter, this.milliseconds, this.silentRefreshInterval, this.cooldownMilliseconds);
	}
}

/** TODOC */
export class SvelteSaga<T> implements Readable<SvelteSagaData<T>> {
	private readonly milliseconds: number;
	private readonly silentRefreshInterval: boolean;
	private readonly cooldownMilliseconds: number;

	private getter: (signal: AbortSignal) => Promise<T> | T;
	private timeout: number = 0;
	private controller: AbortController = new AbortController();
	private store: Writable<SvelteSagaData<T>>;
	private refreshLastInvoked: Date = new Date(0);

	private get millisecondsLeft(): number {
		const now = new Date();
		const timeElapsed = now.getTime() - this.refreshLastInvoked.getTime();
		const timeLeft = this.cooldownMilliseconds - timeElapsed;
		return timeLeft > 0 ? timeLeft : 0;
	}

	private _onCooldown: (millisecondsLeft: number) => void = (millisecondsLeft) => console.info(`${millisecondsLeft}ms left of refresh cooldown`);

	public set onCooldown(value: (millisecondsLeft: number) => void) {
		this._onCooldown = value;
	}

	public get signal(): AbortSignal {
		return this.controller.signal;
	}

	public constructor(getter: (signal: AbortSignal) => Promise<T> | T, milliseconds: number, silentRefreshInterval: boolean, cooldownMilliseconds: number) {
		this.getter = getter;
		this.milliseconds = milliseconds;
		this.silentRefreshInterval = silentRefreshInterval;
		this.cooldownMilliseconds = cooldownMilliseconds;
		const tempPromise = indefinitePromise<T>();
		this.store = writable<SvelteSagaData<T>>({
			error: null,
			maybePromise: tempPromise,
			promise: tempPromise,
			pending: true,
			value: void 0,
			messages: {}
		});
	}

	private abort(reason: string): void {
		this.controller.abort(reason);
		this.controller = new AbortController();
	}

	private async get(silent = false): Promise<T> {
		// Clear timeout if any and signal cancel for pending requests
		this.abort("New request invoked. Aborting previous.");
		if (this.timeout && typeof window !== "undefined") {
			window.clearTimeout(this.timeout);
		}

		const promise = Promise.resolve(this.getter(this.signal));
		if (!silent) {
			console.info("updating pending promise");
			this.store.update((prev) => ({ ...prev, pending: true, error: null, promise, maybePromise: promise }));
		}

		let res: T;
		try {
			res = await promise;
			console.info("updating resolved promise");
			console.log(res);
			this.store.update((prev) => ({ ...prev, pending: false, error: null, value: res, maybePromise: res }));
		} catch (e) {
			if (e instanceof Error) {
				console.info("updating rejected promise");
				this.store.update((prev) => ({ ...prev, pending: false, error: e as Error, maybePromise: Promise.reject(e) }));
			}
			throw e;
		}

		// Set up new interval if relevant
		if (this.milliseconds > 0 && typeof window !== "undefined") {
			this.timeout = window.setTimeout(() => this.get(this.silentRefreshInterval), this.milliseconds);
		}

		return res;
	}

	public setGetter(getter: (signal: AbortSignal) => Promise<T> | T): this {
		this.getter = getter;
		return this;
	}

	public setValue(value: T): this {
		this.store.update((prev) => ({ ...prev, value, maybePromise: value, promise: Promise.resolve(value), error: null, pending: false }));
		return this;
	}

	public async start(silent = false): Promise<T> {
		return await this.get(silent);
	}

	public stop(): void {
		this.abort("Saga stopped");
		if (this.timeout && typeof window !== "undefined") {
			window.clearTimeout(this.timeout);
		}
	}

	public setOptimistic(deserializer: Deserializer<T> | null, something: unknown): () => void {
		const val = get(this.store).value;
		let rollback: () => void;
		let prevValue: T | undefined;
		if (typeof val === "undefined") {
			rollback = () => {
				console.info("updating rolled back value");
				this.store.update((prev) => ({ ...prev, value: void 0 }));
			};
		} else {
			prevValue = cloneViaSerialization<T>(deserializer ?? void 0, val);
			rollback = () => {
				const promise = Promise.resolve<T>(prevValue!);
				console.info("updating rolled back value");
				this.store.update((prev) => ({ ...prev, value: prevValue, promise, maybePromise: promise }));
			};
		}

		if (something instanceof FormData) {
			if (typeof prevValue !== "undefined") something = { ...prevValue, ...formDataToObject(something) };
			else something = formDataToObject(something);
		}

		const newValue = deserialize<T>(deserializer, something);
		console.info("updating optimistic value");
		this.store.update((prev) => ({ ...prev, value: newValue, maybePromise: newValue }));

		return rollback;
	}

	public async refresh(silent = false): Promise<T> {
		if (this.millisecondsLeft > 0) {
			this._onCooldown(this.millisecondsLeft);
			return await get(this.store).promise;
		}
		this.refreshLastInvoked = new Date();
		return await this.get(silent);
	}

	/** Set error keys for displaying messages relating to saga to user for convenience */
	public setMessage(key: string, verbosity: "info" | "warn" | "error", message: string): void {
		this.store.update((prev) => ({ ...prev, messages: { ...prev.messages, [key]: { verbosity, message } } }));
	}

	public clearMessages(): this {
		this.store.update((prev) => ({ ...prev, messages: {} }));
		return this;
	}

	public subscribe(run: Subscriber<SvelteSagaData<T>>, invalidate?: Invalidator<SvelteSagaData<T>>): Unsubscriber {
		return this.store.subscribe(run, invalidate);
	}
}
