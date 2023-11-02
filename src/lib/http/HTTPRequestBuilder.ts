import type { DateOnly, DateWrap } from "$lib/date/DateOnly.js";
import {
	ensureArray,
	ensureBigIntString,
	ensureBooleanString,
	ensureDateOnlyString,
	ensureDateString,
	ensureNumberString,
	ensureObject,
	ensureString
} from "$lib/types/unknown.js";
import type { Fetch } from "./Fetch.js";
import type { Postprocess } from "./Postprocess.js";
import type { Preprocess } from "./Preprocess.js";
import type { HTTPClientOptions } from "$lib/http/HTTPClientOptions.js";
import { HTTPResponseError } from "$lib/http/HTTPResponseError";

/** TODOC */
export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// noinspection JSUnusedGlobalSymbols
/** TODOC */
export class HTTPRequestBuilder {
	/** TODOC */
	private readonly baseAddress: URL | null = null;

	/** TODOC */
	private readonly _requestUri: string;

	/** TODOC */
	private readonly requestInit: RequestInit;

	/** @see HTTPClientOptions */
	private readonly options: HTTPClientOptions;

	/** @see XMLHttpRequest */
	private xmlHttpRequest?: XMLHttpRequest;

	/** TODOC */
	private query: URLSearchParams | null = null;

	/** TODOC */
	private params: unknown[] | null = null;

	/** TODOC */
	private optional: unknown | null = null;

	/** Status codes to ignore from ensuring success when calling `from{Type}Nullable` */
	private nullStatusCodes: number[] = [];

	/** Status codes to accept */
	private statusCodes: number[] = [];

	/** Whether to check if `Response.ok` is true */
	private ensureSuccess = true;

	/** TODOC */
	constructor(baseAddress: URL | null, httpMethod: HTTPMethod, requestUri: string, options: HTTPClientOptions) {
		this.baseAddress = baseAddress;
		this.requestInit = { ...(options.defaultRequestInit ?? {}) }; // TODO: deep copy this object
		this.requestInit.method = httpMethod;
		this.requestInit.headers = new Headers();
		this._requestUri = requestUri;
		this.options = { ...options };
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
			} else if (this.baseAddress.href.endsWith("/")) {
				if (this._requestUri.startsWith("/")) requestUri = this.baseAddress.host + this._requestUri;
				else requestUri = this.baseAddress.href + this._requestUri;
			} else {
				if (this._requestUri.startsWith("/")) requestUri = this.baseAddress.href + this._requestUri;
				else requestUri = this.baseAddress.host + "/" + this._requestUri;
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
	public withPreprocessor(preprocess: Preprocess): HTTPRequestBuilder {
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
		if (!(this.requestInit.headers instanceof Headers)) throw new Error("Not happening");
		for (const key of Object.keys(headers)) {
			this.requestInit.headers.append(key, headers[key]);
		}
		return this;
	}

	/** HTTP request with application/json content */
	public asJSON(content: object | string): HTTPRequestBuilder {
		if (!(this.requestInit.headers instanceof Headers)) throw new Error("Not happening");
		this.requestInit.headers.append("Content-Type", "application/json");
		this.requestInit.body = typeof content === "string" ? content : JSON.stringify(content);
		return this;
	}

	/** HTTP request with multipart/formdata content */
	public asForm(content: Record<string, string>): HTTPRequestBuilder {
		const formData = new FormData();
		Object.keys(content).forEach((k) => formData.append(k, content[k]));
		this.requestInit.body = formData;
		return this;
	}

	/** HTTP request with application/x-www-form-urlencoded content */
	public asQuery(content: string | URLSearchParams | Record<string, string> | string[][] | undefined): HTTPRequestBuilder {
		this.requestInit.body = new URLSearchParams(content);
		return this;
	}

	/** HTTP request with any `BodyInit` */
	public withBody(body: BodyInit | null | undefined): HTTPRequestBuilder {
		this.requestInit.body = body;
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
	private async internalFetch<TResult>(handler: (response: Response) => Promise<TResult>, signal?: AbortSignal): Promise<TResult> {
		this.requestInit.signal = signal;
		if (typeof this.options.preprocess === "function") await this.options.preprocess(this.requestInit);
		let response = await this._fetch(this.requestUri, this.requestInit);
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
				throw new HTTPResponseError(this.requestInit, response, this.requestUri, e);
			}
			throw e;
		}
	}

	/** @returns The raw request result */
	public async fetch(signal?: AbortSignal): Promise<Response> {
		return await this.internalFetch((response) => Promise.resolve(response), signal);
	}

	/** @returns The XMLHttpRequest */
	public send(signal?: AbortSignal): XMLHttpRequest {
		const request = this.xmlHttpRequest ?? new XMLHttpRequest();

		if (!this.requestInit.method) throw new Error("Request method must be set");
		this.requestInit.signal = signal;
		request.open(this.requestInit.method, this.requestUri, true);

		if (this.requestInit.credentials === "include") request.withCredentials = true;
		if (this.requestInit.body instanceof ReadableStream) throw new Error("Request body cannot be ReadableStream when using XHR");

		request.send(this.requestInit.body);
		return request;
	}

	/** The request body deserialized as a JSON object */
	public async fromJSONObject<TResult = Record<string, unknown>>(ctor?: new (something?: unknown) => TResult, signal?: AbortSignal): Promise<TResult> {
		return await this.internalFetch(async (response) => {
			const json = await response.json();
			const o = ensureObject(json);
			if (ctor) return new ctor(o);
			return o as TResult;
		}, signal);
	}

	/** The request body deserialized as a JSON object */
	public async fromJSONObjectNullable<TResult = Record<string, unknown>>(
		ctor?: new (something?: unknown) => TResult,
		signal?: AbortSignal
	): Promise<TResult | null> {
		this.nullStatusCodes.push(204);
		return await this.fromJSONObject(ctor, signal);
	}

	/** The request body deserialized as a JSON array */
	public async fromJSONArray<TResult = unknown>(ctor?: new (something?: unknown) => TResult, signal?: AbortSignal): Promise<TResult[]> {
		return await this.internalFetch(async (response) => {
			const json = await response.json();
			const arr = ensureArray(json);
			if (ctor) return arr.map((something) => new ctor(something));
			return arr as TResult[];
		}, signal);
	}

	/** The request body deserialized as a JSON array */
	public async fromJSONArrayNullable<TResult = unknown>(ctor?: new (something?: unknown) => TResult, signal?: AbortSignal): Promise<TResult[] | null> {
		this.nullStatusCodes.push(204);
		return await this.fromJSONArray(ctor, signal);
	}

	/** The request body deserialized as string */
	public async fromString(signal?: AbortSignal): Promise<string> {
		return await this.internalFetch((response) => response.text(), signal);
	}

	/** The request body deserialized as string */
	public async fromStringNullable(signal?: AbortSignal): Promise<string | null> {
		this.nullStatusCodes.push(204);
		return await this.fromString(signal);
	}

	/** The request body deserialized as number */
	public async fromNumber(signal?: AbortSignal): Promise<number> {
		const content = await this.fromString(signal);
		return ensureNumberString(content);
	}

	/** The request body deserialized as number or null if 204 */
	public async fromNumberNullable(signal?: AbortSignal): Promise<number | null> {
		this.nullStatusCodes.push(204);
		return await this.fromNumber(signal);
	}

	/** The request body deserialized as bigint */
	public async fromBigint(signal?: AbortSignal): Promise<bigint> {
		const content = await this.fromString(signal);
		return ensureBigIntString(content);
	}

	/** The request body deserialized as number or null if 204 */
	public async fromBigintNullable(signal?: AbortSignal): Promise<bigint | null> {
		this.nullStatusCodes.push(204);
		return await this.fromBigint(signal);
	}

	/** The request body deserialized as boolean */
	public async fromBoolean(signal?: AbortSignal): Promise<boolean> {
		const content = await this.fromString(signal);
		return ensureBooleanString(content);
	}

	/** The request body deserialized as boolean or null if 204 */
	public async fromBooleanNullable(signal?: AbortSignal): Promise<boolean | null> {
		this.nullStatusCodes.push(204);
		return await this.fromBoolean(signal);
	}

	/** The request body deserialized as Date */
	public async fromDateString(signal?: AbortSignal): Promise<Date> {
		const content = await this.fromString(signal);
		return ensureDateString(content);
	}

	/** The request body deserialized as Date or null if 204 */
	public async fromDateStringNullable(signal?: AbortSignal): Promise<Date | null> {
		this.nullStatusCodes.push(204);
		return await this.fromDateString(signal);
	}

	/** The request body deserialized as DateOnly */
	public async fromDateOnlyString(wrap: DateWrap, signal?: AbortSignal): Promise<DateOnly> {
		const content = await this.fromString(signal);
		return ensureDateOnlyString(content, wrap, true);
	}

	/** The request body deserialized as DateOnly or null if 204 */
	public async fromDateOnlyStringNullable(wrap: DateWrap, signal?: AbortSignal): Promise<DateOnly | null> {
		this.nullStatusCodes.push(204);
		return await this.fromDateOnlyString(wrap, signal);
	}

	/** The location header from a 201 response */
	public async create(signal?: AbortSignal): Promise<string> {
		this.statusCodes.push(201);
		return await this.internalFetch((response) => Promise.resolve(ensureString(response.headers.get("Location"))), signal);
	}
}
