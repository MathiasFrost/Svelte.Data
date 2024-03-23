import { type Mutations, RESTHttp } from "$lib/http/RESTHttp.js";
import { type Readable, readonly, writable } from "svelte/store";
import { HTTPResponseError } from "$lib/http/HTTPResponseError.js";
import { indefinitePromise } from "$lib/async/index.js";
import { deserialize } from "$lib/http/Deserializable.js";
import type { Ctor } from "$lib/types/unknown.js";
import type { Key } from "node:readline";

/** TODOC */
interface SvelteHTTPRequest<T> {
	/** TODOC */
	readonly promise: Promise<T>;

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
	start(): void;

	/** TODOC */
	stop(): void;

	/** TODOC */
	mutate<Key extends keyof TMutations>(key: Key): ReturnType<TMutations[Key]>;

	/** TODOC */
	update(mutation: Record<string, unknown> | [string, unknown] | FormData, ctor: Ctor<T>): () => void;

	/** TODOC */
	updateGetter(getter: (http: RESTHttp) => Promise<T>): void;

	/** TODOC */
	updateAndInvokeGetter(getter: (http: RESTHttp) => Promise<T>): void;
}

/** TODOC */
export class SvelteSagaBuilder<T, TMutations extends Mutations> {
	/** TODOC */
	public getter: () => Promise<T> = () => indefinitePromise();

	/** TODOC */
	public mutators: Record<
		keyof TMutations,
		(store: SvelteSaga<T, TMutations>, ...args: Parameters<TMutations[keyof TMutations]>) => ReturnType<TMutations[keyof TMutations]>
	> = {};

	/** TODOC */
	public initialValue: T | undefined;

	/** TODOC */
	private readonly http: RESTHttp;

	/** ctor */
	public constructor(http: RESTHttp) {
		this.http = http;
	}

	/** TODOC */
	public withInitialValue(initialValue: T): this {
		this.initialValue = initialValue;
		return this;
	}

	/** TODOC */
	public withGetter(getter: (http: RESTHttp) => Promise<T>): this {
		this.getter = () => getter(this.http);
		return this;
	}

	/** TODOC */
	public withMutator<Key extends keyof TMutations>(
		key: Key,
		mutator: (factory: RESTHttp, store: SvelteSaga<T, TMutations>, ...args: Parameters<TMutations[Key]>) => ReturnType<TMutations[Key]>
	): this {
		this.mutators[key] = (store: SvelteSaga<T, TMutations>, ...args: Parameters<TMutations[Key]>) => mutator(this.http, store, ...args);
		return this;
	}

	/** TODOC */
	public toSvelteStore(): SvelteSaga<T, TMutations> {
		const abort = new AbortController();

		const store = writable<SvelteHTTPRequest<T>>({
			pending: this.options.startImmediately ? true : null,
			promise: this.options.startImmediately ? setupPromise(this.getter) : indefinitePromise(),
			error: null,
			hasValue: false
		});

		function setupPromise(getter: () => Promise<T>): Promise<T> {
			const promise = getter();
			promise
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

		return {
			...readonly(store),
			update(mutation: Record<string, unknown> | [string, unknown] | FormData, ctor: Ctor<T>): () => void {
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
						store.set({ pending: prev.pending, hasValue: prev.hasValue, error: prev.error, promise: prev.promise });
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
			refresh: async (silent) => {
				const promise = setupPromise(this.getter);
				if (!silent) {
					store.set({
						pending: true,
						hasValue: false,
						error: null,
						promise
					});
				}
				return await promise;
			},
			start: () => {
				store.update((prev) => {
					if (prev.pending !== null) return prev;
					return {
						pending: true,
						promise: setupPromise(this.getter),
						hasValue: false,
						error: null
					};
				});
			},
			stop() {
				abort.abort();
			},
			mutate<Key extends keyof TMutations>(key: Key): ReturnType<TMutations[Key]> {}
		};
	}
}
