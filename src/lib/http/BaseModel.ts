import type { Fetch } from "$lib/http/Fetch.js";
import { type Readable, readonly, type Writable, writable } from "svelte/store";
import { HTTPResponseError } from "$lib/http/HTTPResponseError.js";
import type { Postprocess } from "$lib/http/Postprocess.js";
import type { Preprocess } from "$lib/http/Preprocess.js";
import { indefinitePromise } from "$lib/async/index.js";
import { createEventDispatcher } from "svelte";

enum TypeCode {
	string,
	number,
	object
}

function Type(expectedType: new (...args: never[]) => unknown): (target: object, propertyKey: string) => void {
	let typeCode: TypeCode;
	if (expectedType === String) {
		typeCode = TypeCode.string;
	} else if (expectedType === Number) {
		typeCode = TypeCode.number;
	} else {
		typeCode = TypeCode.object;
	}

	return function (target: object, propertyKey: string): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		target["__typeCodes"] ??= {};
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		target["__typeCodes"][propertyKey] = typeCode;
	};
}

function Deserializable(target: new (...args: never[]) => object): void {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	target.deserialize = function (input: Record<string, unknown>): unknown {
		const res = new target();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		const typeCodes = res["__typeCodes"] as Record<string, TypeCode>;
		Object.keys(input).forEach((key) => {
			let expected = "";
			switch (typeCodes[key]) {
				case TypeCode.string:
					if (typeof input[key] !== "string") {
						expected = "string";
					}
					break;
				case TypeCode.number:
					if (typeof input[key] !== "number") {
						expected = "number";
					}
					break;
				case TypeCode.object:
					break;
				default:
					throw new Error("Unsupported type");
			}
			if (expected) {
				throw new Error(`Expected type '${expected}' for field '${key}', got type '${typeof input[key]}'`);
			}

			Reflect.set(res, key, input[key]);
		});
		return res;
	};
}

@Deserializable
export class User {
	@Type(String)
	public readonly name: string = "";

	@Type(Number)
	public readonly age: number = 0;
}
interface SvelteHTTPOptions extends RequestInit {
	readonly milliseconds: number;
	readonly refreshOnFocus: boolean;
	readonly pauseOnBlur: boolean;
	postprocess: Postprocess;
	preprocess: Preprocess;
	readonly startImmediately: boolean;
	fetch: Fetch;
}

interface SvelteHTTPRequest<T> {
	readonly promise: Promise<T>;
	get value(): T;
	readonly pending: boolean | null;
	readonly error: HTTPResponseError | null;
	readonly hasValue: boolean;
}

type Mutations = Record<string, (...args: never[]) => Promise<unknown>>;

interface SvelteHTTPRequestStore<T, TMutations extends Mutations> extends Readable<SvelteHTTPRequest<T>> {
	refresh(silent?: boolean): Promise<T>;
	start(): void;
	mutate<Key extends keyof TMutations>(key: Key): ReturnType<TMutations[Key]>;
}

// noinspection JSUnusedGlobalSymbols
/** Class to handle HTTP requests (`fetch`/`XHR`) */
export class SvelteHTTPFactory {
	/** Base address for requests made with this client */
	public readonly baseAddress: URL | string | null = null;

	/** @see SvelteHTTPOptions */
	private readonly options: Partial<SvelteHTTPOptions>;

	/** ctor */
	public constructor(baseAddress = "", options: Partial<SvelteHTTPOptions> = {}) {
		try {
			this.baseAddress = new URL(baseAddress);
		} catch (e) {
			console.warn("Base address could not be constructed from constructor");
			this.baseAddress = baseAddress;
		}
		this.options = options;
	}

	/** TODOC */
	public saga<T, TMutations extends Mutations>(): SvelteHTTPBuilder<T, TMutations> {
		return new SvelteHTTPBuilder<T, TMutations>(this);
	}

	/** TODOC */
	public get(requestUri: string): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "GET", requestUri, this.options);
	}

	/** TODOC */
	public post(requestUri: string): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "POST", requestUri, this.options);
	}

	/** TODOC */
	public put(requestUri: string): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "PUT", requestUri, this.options);
	}

	/** TODOC */
	public patch(requestUri: string): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "PATCH", requestUri, this.options);
	}

	/** TODOC */
	public delete(requestUri: string): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "DELETE", requestUri, this.options);
	}
}

/** TODOC */
export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// noinspection JSUnusedGlobalSymbols
/** TODOC */
export class HTTPRequestBuilder {
	/** TODOC */
	public readonly baseAddress: URL | string | null = null;

	/** TODOC */
	public readonly _requestUri: string;

	/** @see HTTPClientOptions */
	public readonly options: Partial<SvelteHTTPOptions>;

	/** @see XMLHttpRequest */
	public xmlHttpRequest?: XMLHttpRequest;

	/** TODOC */
	public query: URLSearchParams | null = null;

	/** TODOC */
	public params: unknown[] | null = null;

	/** TODOC */
	public optional: unknown | null = null;

	/** Status codes to ignore from ensuring success when calling `from{Type}Nullable` */
	public nullStatusCodes: number[] = [];

	/** Status codes to accept */
	public statusCodes: number[] = [];

	/** Whether to check if `Response.ok` is true */
	public ensureSuccess = true;

	/** TODOC */
	constructor(baseAddress: URL | string | null, httpMethod: HTTPMethod, requestUri: string, options: Partial<SvelteHTTPOptions>) {
		this.baseAddress = baseAddress;
		this.options = { ...options };
		this.options.method = httpMethod;
		this.options.headers ??= new Headers();
		this._requestUri = requestUri;
	}

	/** Get the server-side `load` `fetch` or client-side `window.fetch` */
	private get _fetch(): Fetch {
		if (this.options.fetch) return this.options.fetch;
		if (typeof window !== "undefined") return window.fetch;
		throw new Error("Attempted to use HTTPClient server-side without supplying the load's fetch function");
	}

	/** TODOC */
	public get requestUri(): string {
		let requestUri = "";
		// noinspection HttpUrlsUsage
		if (this._requestUri.startsWith("https://") || this._requestUri.startsWith("http://")) requestUri = this._requestUri;
		else {
			if (this.baseAddress === null) {
				// noinspection HttpUrlsUsage
				if (this._requestUri.startsWith("https://") || this._requestUri.startsWith("http://")) requestUri = this._requestUri;
				else throw new Error("When baseAddress is not set, requestUris must be a fully qualified URI");
			} else if (typeof this.baseAddress === "string") {
				if (this.baseAddress.endsWith("/")) {
					if (this._requestUri.startsWith("/")) requestUri = this.baseAddress + this._requestUri;
					else requestUri = this.baseAddress + this._requestUri;
				} else {
					if (this._requestUri.startsWith("/")) requestUri = this.baseAddress + this._requestUri;
					else requestUri = this.baseAddress + "/" + this._requestUri;
				}
			} else if (this.baseAddress instanceof URL) {
				if (this.baseAddress.href.endsWith("/")) {
					if (this._requestUri.startsWith("/")) requestUri = this.baseAddress.host + this._requestUri;
					else requestUri = this.baseAddress.href + this._requestUri;
				} else {
					if (this._requestUri.startsWith("/")) requestUri = this.baseAddress.href + this._requestUri;
					else requestUri = this.baseAddress.host + "/" + this._requestUri;
				}
			}
		}

		if (this.params !== null) {
			for (const param of this.params) {
				requestUri += "/" + encodeURIComponent(`${param}`);
			}
		}

		if (this.optional !== null) requestUri += "/" + this.optional;

		if (this.query !== null) requestUri += "?" + this.query;

		return requestUri;
	}

	/** Make request use a different `fetch` implementation, commonly the `fetch` passed from your `load` function when using SvelteKit */
	public withFetch(fetch?: Fetch): HTTPRequestBuilder {
		this.options.fetch = fetch;
		return this;
	}

	/** Add preprocessor to this request. Overrides the one from HTTPClient */
	public withPreprocess(preprocess: Preprocess): HTTPRequestBuilder {
		this.options.preprocess = preprocess;
		return this;
	}

	/** Add preprocessor to this request. Overrides the one from HTTPClient */
	public withPostprocess(postprocess: Postprocess): HTTPRequestBuilder {
		this.options.postprocess = postprocess;
		return this;
	}

	/** Make request use the supplied `XMLHttpRequest` instead of creating a new one */
	public withXMLHttpRequest(xmlHttpRequest: XMLHttpRequest): HTTPRequestBuilder {
		this.xmlHttpRequest = xmlHttpRequest;
		return this;
	}

	/** Add query parameters to request URI */
	public withQuery(query: string | URLSearchParams | Record<string, string> | string[][] | undefined): HTTPRequestBuilder {
		this.query = new URLSearchParams(query);
		return this;
	}

	/** Add route/path parameters to request URI with `encodeURIComponent` */
	public withParams(...params: unknown[]): HTTPRequestBuilder {
		this.params = params;
		return this;
	}

	/** Add an optional route/path parameter to request URI
	 *
	 * This will be appended at the end of the path with `encodeURIComponent` and can only be one */
	public withOptional(param: unknown): HTTPRequestBuilder {
		this.optional = param;
		return this;
	}

	/** Add status code for which to return null in `from{Type}` methods when encountered */
	public acceptNullFrom(...statusCodes: number[]): HTTPRequestBuilder {
		this.nullStatusCodes = statusCodes;
		return this;
	}

	/** Add status codes that will be considered successful */
	public accept(...statusCodes: number[]): HTTPRequestBuilder {
		this.statusCodes = statusCodes;
		return this;
	}

	/** Disable ensuring success, effectively accepting all status codes */
	public acceptAny(): HTTPRequestBuilder {
		this.ensureSuccess = false;
		return this;
	}

	/** Add headers to content */
	public withHeaders(headers: Record<string, string>): HTTPRequestBuilder {
		if (!(this.options.headers instanceof Headers)) throw new Error("Not happening");
		for (const key of Object.keys(headers)) {
			this.options.headers.append(key, headers[key]);
		}
		return this;
	}

	/** HTTP request with application/json content */
	public asJSON(content: object | string): HTTPRequestBuilder {
		if (!(this.options.headers instanceof Headers)) throw new Error("Not happening");
		this.options.headers.append("Content-Type", "application/json");
		this.options.body = typeof content === "string" ? content : JSON.stringify(content);
		return this;
	}

	/** HTTP request with multipart/formdata content */
	public asForm(content: Record<string, string>): HTTPRequestBuilder {
		const formData = new FormData();
		Object.keys(content).forEach((k) => formData.append(k, content[k]));
		this.options.body = formData;
		return this;
	}

	/** HTTP request with application/x-www-form-urlencoded content */
	public asQuery(content: string | URLSearchParams | Record<string, string> | string[][] | undefined): HTTPRequestBuilder {
		this.options.body = new URLSearchParams(content);
		return this;
	}

	/** HTTP request with any `BodyInit` */
	public withBody(body: BodyInit | null | undefined): HTTPRequestBuilder {
		this.options.body = body;
		return this;
	}

	/** TODOC */
	private ensureWithinStatusCode(response: Response): void {
		if (this.statusCodes.includes(response.status)) return;
		throw new Error(`Expected status code ${this.statusCodes.join(", ")}. Got: ${response.status}`);
	}

	/** TODOC */
	private ensureSuccessStatusCode(response: Response): void {
		if (response.ok) return;
		throw new Error(`Expected status code indicating success. Got: ${response.status}`);
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

	public static deserialize<TResult>(ctor: new (...args: never[]) => TResult, o: unknown): TResult {
		if (o === null || typeof o !== "object") throw new Error("Could not deserialize JSON");
		if (!Reflect.has(ctor, "deserialize")) throw new Error("Class does not have @Deserializable decorator");
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		return ctor.deserialize(o);
	}

	/** The request body deserialized as a JSON object */
	public fromJSONObject<TResult = Record<string, unknown>>(ctor: new (...args: never[]) => TResult, signal?: AbortSignal): SvelteHTTPRequestStore<TResult> {
		return this.internalFetch(async (response) => {
			const json = await response.json();
			return HTTPRequestBuilder.deserialize(ctor, json);
		}, signal);
	}
}

/** TODOC */
class SvelteHTTPBuilder<T, TMutations extends Mutations> {
	/** TODOC */
	public customGetter: (() => Promise<T>) | undefined;

	/** TODOC */
	public httpStore: SvelteHTTPRequestStore<T, TMutations> | undefined;

	/** TODOC */
	public initialValue: T | undefined;

	/** TODOC */
	private readonly http: SvelteHTTPFactory;

	/** ctor */
	public constructor(http: SvelteHTTPFactory) {
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
	public withGetter(builder: (factory: SvelteHTTPFactory) => SvelteHTTPRequestStore<T, TMutations>): this {
		this.httpStore = builder(this.http);
		return this;
	}

	/** TODOC */
	public withMutator<Key extends keyof TMutations>(
		key: Key,
		builder: (factory: SvelteHTTPFactory, store: SvelteHTTPRequestStore<T, TMutations>, ...args: Parameters<TMutations[Key]>) => ReturnType<TMutations[Key]>
	): this {
		this.httpStore = builder(this.http);
		return this;
	}

	public toSvelteStore(): SvelteHTTPRequestStore<T, TMutations> {
		return readonly(writable());
	}
}

const testHttp = new SvelteHTTPFactory("/api/");

export const justHttpUser: User = await testHttp.get("test").fromJSONObject(User);

export const userSaga = testHttp
	.saga<User, { update: (id: number, form: FormData) => Promise<number>; delete: (id: number) => Promise<void> }>()
	.withGetter((factory) => factory.get("test").fromJSONObject(User))
	.withMutator("update", async (factory, store, id, form) => {
		let newId: number;
		if (optimistic) {
			const rollback = store.mutate(form);
			try {
				newId = await factory.post("update").withParams(id).withBody(form).fromNumber();
			} catch (e) {
				rollback();
				throw e;
			}
			store.updateGetter((factory) => factory.get("test").withParams(newId).fromJSONObject(User));
		} else {
			newId = await factory.post("update").withParams(id).withBody(form).fromNumber();
			store.updateAndInvokeGetter((factory) => factory.get("test").withParams(newId).fromJSONObject(User));
		}
		return newId;
	})
	.toSvelteStore();

const storeHttpUser: User = await $userSaga.promise;
const id = await userSaga.mutate("update");
const ida = await userSaga.mutate("delete");
