import { type Mutations, RESTHttp } from "$lib/http/RESTHttp.js";
import { readonly, writable } from "svelte/store";
import { HTTPResponseError } from "$lib/http/HTTPResponseError.js";
import { indefinitePromise } from "$lib/async/index.js";

/** TODOC */
export class SvelteSagaBuilder<T, TMutations extends Mutations> {
	/** TODOC */
	public customGetter: (() => Promise<T>) | undefined;

	/** TODOC */
	public httpStore: SvelteHTTPRequestStore<T, TMutations> | undefined;

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
	public withCustomGetter(getter: () => Promise<T>): this {
		this.customGetter = getter;
		return this;
	}

	/** TODOC */
	public withGetter(builder: (factory: RESTHttp) => SvelteHTTPRequestStore<T, TMutations>): this {
		this.httpStore = builder(this.http);
		return this;
	}

	/** TODOC */
	public withMutator<Key extends keyof TMutations>(
		key: Key,
		builder: (factory: RESTHttp, store: SvelteHTTPRequestStore<T, TMutations>, ...args: Parameters<TMutations[Key]>) => ReturnType<TMutations[Key]>
	): this {
		this.httpStore = builder(this.http);
		return this;
	}

	public toSvelteStore(): SvelteHTTPRequestStore<T, TMutations> {
		return readonly(writable());
	}

	/** TODOC */
	private internalFetch<TResult>(handler: (response: Response) => Promise<TResult>, signal?: AbortSignal): SvelteHTTPRequestStore<TResult> {
		const promiseFactory: () => Promise<TResult> = async () => {
			this.options.signal = signal;
			if (typeof this.options.preprocess === "function") await this.options.preprocess(this.options, this);
			let response = await this._fetch(this.requestUri, this.options);
			if (typeof this.options.postprocess === "function") response = await this.options.postprocess(response, this);

			try {
				// Early return null if status code is among null status codes
				if (this.nullStatusCodes.includes(response.status)) return null as TResult;

				// Check if status code is within acceptable values
				if (this.statusCodes.length) this.ensureWithinStatusCode(response);
				else if (this.ensureSuccess) this.ensureSuccessStatusCode(response);

				return await handler(response);
			} catch (e) {
				if (e instanceof Error) {
					throw new HTTPResponseError(this.options, response, this.requestUri, e);
				}
				throw e;
			}
		};

		const store = writable<SvelteHTTPRequest<TResult>>({
			pending: this.options.startImmediately ? true : null,
			promise: this.options.startImmediately ? setupPromise() : indefinitePromise(),
			get value(): TResult {
				throw new Error("Value is not ready. Check hasValue before accessing");
			},
			error: null,
			hasValue: false
		});

		function setupPromise(): Promise<TResult> {
			const promise = promiseFactory();
			promise
				.then((value) =>
					store.update((prev) => ({
						pending: false,
						error: null,
						hasValue: true,
						promise: prev.promise,
						get value(): TResult {
							return value;
						}
					}))
				)
				.catch((e) => {
					if (e instanceof HTTPResponseError) {
						store.update((prev) => ({
							pending: false,
							error: e,
							hasValue: false,
							promise: prev.promise,
							get value(): TResult {
								throw new Error("Value is not ready. Check hasValue before accessing");
							}
						}));
					} else {
						throw e;
					}
				});

			return promise;
		}

		return {
			...readonly(store),
			update(mutation: Record<string, unknown> | [string, unknown] | FormData, ctor: new (...args: never[]) => TResult): () => void {
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
					const value = HTTPRequestBuilder.deserialize<TResult>(ctor, newValue);
					return {
						pending: true,
						hasValue: false,
						error: null,
						promise: prev.promise,
						get value(): TResult {
							return value;
						}
					};
				});

				return rollback;
			},
			async refresh(silent?: boolean): Promise<TResult> {
				const promise = setupPromise();
				if (!silent) {
					store.set({
						pending: true,
						hasValue: false,
						error: null,
						promise,
						get value(): TResult {
							throw new Error("Value is not ready. Check hasValue before accessing");
						}
					});
				}
				return await promise;
			},
			start() {
				store.update((prev) => {
					if (prev.pending !== null) return prev;
					return {
						pending: true,
						promise: setupPromise(),
						hasValue: false,
						error: null,
						get value(): TResult {
							throw new Error("Value is not ready. Check hasValue before accessing");
						}
					};
				});
			}
		};
	}
}
