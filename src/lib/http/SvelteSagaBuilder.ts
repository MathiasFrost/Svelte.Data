import { type Mutations } from "$lib/http/RESTHttp.js";
import { type Readable, readonly, writable } from "svelte/store";
import { HTTPResponseError } from "$lib/http/HTTPResponseError.js";
import { indefinitePromise } from "$lib/async/index.js";
import { deserialize } from "$lib/http/Deserializable.js";
import type { Deserializer } from "$lib/types/unknown.js";

/** TODOC */
interface SvelteHTTPRequest<T> {
	/** TODOC */
	readonly promise: Promise<T> | T;

	/** TODOC */
	value?: T;

	/** TODOC */
	readonly pending: boolean | null;

	/** TODOC */
	readonly error: HTTPResponseError | null;

	/** TODOC */
	readonly hasValue: boolean;
}

/** TODOC */
interface SvelteSaga<T, TMutations extends Mutations> extends Readable<SvelteHTTPRequest<T>> {
	/** TODOC */
	refresh(silent?: boolean): Promise<T>;

	/** TODOC */
	start(): Promise<T>;

	/** TODOC */
	startWithGetter(getter: (signal: AbortSignal) => Promise<T> | T): Promise<T>;

	/** TODOC */
	stop(): void;

	/** TODOC */
	mutate<Key extends keyof TMutations>(key: Key, ...args: Parameters<TMutations[Key]>): Promise<ReturnType<TMutations[Key]>>;

	/** TODOC */
	update(ctor: Deserializer<T>, mutation: Record<string, unknown> | [string, unknown] | FormData): () => void;

	/** TODOC */
	updateGetter(getter: (signal: AbortSignal) => Promise<T> | T): void;

	/** TODOC */
	updateAndInvokeGetter(getter: (signal: AbortSignal) => Promise<T> | T, silent?: boolean): Promise<T>;
}

/** TODOC */
export class SvelteSagaBuilder<T, TMutations extends Mutations> {
	/** TODOC */
	public getter: () => Promise<T> | T = () => indefinitePromise();

	/** TODOC */
	public milliseconds: number = 0;

	/** TODOC */
	public refreshOnFocus: boolean = false;

	/** TODOC */
	public pauseOnBlur: boolean = false;

	/** TODOC */
	public mutators = {} as Record<
		keyof TMutations,
		(signal: AbortSignal, ...args: Parameters<TMutations[keyof TMutations]>) => ReturnType<TMutations[keyof TMutations]>
	>;

	/** TODOC */
	public initialValue: T | undefined;

	/** ctor */
	public constructor() {}

	/** TODOC */
	public withInitialValue(initialValue: T): this {
		this.initialValue = initialValue;
		return this;
	}

	/** TODOC */
	public withGetter(getter: () => Promise<T> | T): this {
		this.getter = getter;
		return this;
	}

	/** TODOC */
	public withMutator<Key extends keyof TMutations>(
		key: Key,
		mutator: (signal: AbortSignal, ...args: Parameters<TMutations[Key]>) => ReturnType<TMutations[Key]>
	): this {
		this.mutators[key] = mutator;
		return this;
	}

	/** TODOC */
	public toSvelteStore(): SvelteSaga<T, TMutations> {
		const abort = new AbortController();

		const store = writable<SvelteHTTPRequest<T>>({
			pending: null,
			promise: indefinitePromise(),
			error: null,
			hasValue: false
		});

		function setupPromise(getter: (signal: AbortSignal) => Promise<T> | T): Promise<T> | T {
			const promise = getter(abort.signal);
			Promise.resolve(promise)
				.then((value) =>
					store.update((prev) => ({
						pending: false,
						error: null,
						hasValue: true,
						promise: prev.promise,
						value
					}))
				)
				.catch((e) => {
					if (e instanceof HTTPResponseError) {
						store.update((prev) => ({
							pending: false,
							error: e,
							hasValue: false,
							promise: prev.promise,
							value: prev.value
						}));
					} else {
						throw e;
					}
				});

			return promise;
		}

		const config: {
			mutators: Record<
				keyof TMutations,
				(signal: AbortSignal, ...args: Parameters<TMutations[keyof TMutations]>) => ReturnType<TMutations[keyof TMutations]>
			>;
			getter: (signal: AbortSignal) => Promise<T> | T;
		} = {
			mutators: this.mutators,
			getter: () => indefinitePromise<T>()
		};

		return {
			...readonly(store),
			async start() {
				const promise = config.getter(abort.signal);
				store.set({
					pending: true,
					promise,
					hasValue: false,
					error: null
				});
				return await promise;
			},
			async startWithGetter(getter: (signal: AbortSignal) => Promise<T> | T) {
				config.getter = () => setupPromise(getter);
				return await this.start();
			},
			update(ctor: Deserializer<T>, mutation: Record<string, unknown> | [string, unknown] | FormData): () => void {
				let rollback: () => void = () => {};
				store.update((prev) => {
					const newValue = { ...prev.value } as Record<string, unknown>;
					if (mutation instanceof FormData) {
						for (const formDatum of mutation) {
							newValue[formDatum[0]] = formDatum[1];
						}
					} else if (Array.isArray(mutation)) {
						newValue[mutation[0]] = mutation[1];
					} else if (typeof mutation === "object") {
						for (const key of Object.keys(mutation)) {
							newValue[key] = mutation[key];
						}
					}
					rollback = () => {
						console.log(prev);
						store.set({
							pending: prev.pending,
							hasValue: prev.hasValue,
							error: prev.error,
							promise: typeof prev.value === "undefined" ? indefinitePromise() : Promise.resolve(prev.value),
							value: prev.value
						});
					};
					const value = deserialize<T>(ctor, newValue);
					return {
						pending: true,
						hasValue: false,
						error: null,
						promise: prev.promise,
						value
					};
				});

				return rollback;
			},
			async refresh(silent?: boolean): Promise<T> {
				const promise = config.getter(abort.signal);
				if (!silent) {
					store.update((prev) => ({
						pending: true,
						hasValue: false,
						error: null,
						promise,
						value: prev.value
					}));
				}
				return await promise;
			},
			async mutate<Key extends keyof TMutations>(key: Key, ...args: Parameters<TMutations[Key]>): Promise<ReturnType<TMutations[Key]>> {
				try {
					return await config.mutators[key](abort.signal, ...args);
				} catch (e) {
					if (e instanceof HTTPResponseError) {
						store.update((prev) => ({
							pending: false,
							promise: prev.promise,
							hasValue: prev.hasValue,
							error: e as HTTPResponseError,
							value: prev.value
						}));
					}
					throw e;
				}
			},
			updateGetter(getter: (signal: AbortSignal) => Promise<T> | T) {
				config.getter = () => setupPromise(getter);
			},
			async updateAndInvokeGetter(getter: (signal: AbortSignal) => Promise<T> | T, silent?: boolean) {
				config.getter = () => setupPromise(getter);
				return await this.refresh(silent);
			},
			stop() {
				abort.abort();
			}
		};
	}
}
