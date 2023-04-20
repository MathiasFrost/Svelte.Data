import { ensureArray, ensureBigint, ensureBoolean, ensureDateString, ensureNumber } from "$lib/shared/UnknownObject.js";
import type { Postprocess } from "./Postprocess.js";
import type { Preprocess } from "./Preprocess.js";

/** */
export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** */
export type Deserialize<TResult> = (something?: unknown) => TResult;

/** */
export type Dictionary = {
	[k: string]: string;
};

/** */
export class HTTPRequestBuilder {
	/** */
	private readonly baseAddress: URL | null = null;

	/** @see Preprocess */
	private readonly preprocess?: Preprocess;

	/** @see Postprocess */
	private readonly postprocess?: Postprocess;

	/** */
	private readonly _requestUri: string;

	/** */
	private readonly ensureSuccess: boolean;

	/** */
	private readonly requestInit: RequestInit;

	/** */
	private query: URLSearchParams | null = null;

	/** */
	private params: unknown[] | null = null;

	/** */
	private optional: unknown | null = null;

	/** Status codes to ignore from ensureing success when calling `from{Type}Nullable` */
	private nullStatusCodes: number[] | null = null;

	/** */
	private static __fetch: typeof window.fetch | null = null;

	/** */
	private static get _fetch(): typeof window.fetch {
		if (typeof window !== "undefined") return window.fetch;
		if (this.__fetch === null) throw new Error("Attempting to use HTTPClient server-side without calling setFetch with the fetch passed from load");
		return this.__fetch;
	}

	/** @internal */
	public static setFetch(fetch: typeof window.fetch): void {
		this.__fetch = fetch;
	}

	/** */
	constructor(
		baseAddress: URL | null,
		httpMethod: HTTPMethod,
		requestUri: string,
		ensureSuccess: boolean,
		defaultRequestInit: RequestInit,
		preprocess?: Preprocess,
		postprocess?: Postprocess
	) {
		this.baseAddress = baseAddress;
		this.requestInit = { ...defaultRequestInit }; // TODO: deep copy this object
		this.requestInit.method = httpMethod;
		this.requestInit.headers = new Headers();
		this._requestUri = requestUri;
		this.ensureSuccess = ensureSuccess;
		this.preprocess = preprocess;
		this.postprocess = postprocess;
	}

	/** */
	private get requestUri(): string {
		let requestUri = "";
		if (this.baseAddress === null) {
			if (this._requestUri.startsWith("https://") || this._requestUri.startsWith("http://")) requestUri = this._requestUri;
			throw new Error("When baseAddress is not set, requestUris must be a fully qualified URI");
		}

		if (this.baseAddress.href.endsWith("/")) {
			if (this._requestUri.startsWith("/")) requestUri = this.baseAddress.host + this._requestUri;
			else requestUri = this.baseAddress.href + this._requestUri;
		} else {
			if (this._requestUri.startsWith("/")) requestUri = this.baseAddress.href + this._requestUri;
			else requestUri = this.baseAddress.host + "/" + this._requestUri;
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

	/** Add query parameters to request URI */
	public withQuery(query: Dictionary | URLSearchParams): HTTPRequestBuilder {
		this.query = new URLSearchParams(query);
		return this;
	}

	/** Add route/path parameters to request URI with `encodeURIComponent` */
	public withParams(...params: unknown[]): HTTPRequestBuilder {
		this.params = params;
		return this;
	}

	/** Add a optional route/path parameter to request URI
	 *
	 * This will be appended at the end of the path with `encodeURIComponent` and can only be one */
	public withOptional(param: unknown): HTTPRequestBuilder {
		this.optional = param;
		return this;
	}

	/** Add status codes that should be treated as 204 No Content when calling `from{Type}Nullable` */
	public withNullStatus(...statusCodes: number[]): HTTPRequestBuilder {
		this.nullStatusCodes = statusCodes;
		return this;
	}

	/** Add headers to content */
	public withHeaders(headers: Dictionary): HTTPRequestBuilder {
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
	public asForm(content: Dictionary): HTTPRequestBuilder {
		const formData = new FormData();
		Object.keys(content).forEach((k) => formData.append(k, content[k]));
		this.requestInit.body = formData;
		return this;
	}

	/** HTTP request with application/x-www-form-urlencoded content */
	public asQuery(content: Dictionary): HTTPRequestBuilder {
		this.requestInit.body = new URLSearchParams(content);
		return this;
	}

	/** HTTP request with text/plain content */
	public asText(content: string): HTTPRequestBuilder {
		this.requestInit.body = content;
		return this;
	}

	/** @returns The raw request result */
	public async fetch(signal?: AbortSignal): Promise<Response> {
		this.requestInit.signal = signal;
		if (typeof this.preprocess === "function") await this.preprocess(this.requestInit);

		const response = await HTTPRequestBuilder._fetch(this.requestUri, this.requestInit);
		if (this.ensureSuccess) response.ensureSuccess();

		if (typeof this.postprocess === "function") await this.postprocess(response);
		return response;
	}

	/** @returns The raw request result */
	private async fetchNullable(signal?: AbortSignal): Promise<[Response, boolean]> {
		this.requestInit.signal = signal;
		if (typeof this.preprocess === "function") await this.preprocess(this.requestInit);

		const response = await HTTPRequestBuilder._fetch(this.requestUri, this.requestInit);

		const isNull = response.status === 204 || (this.nullStatusCodes !== null && this.nullStatusCodes.includes(response.status));
		if (!isNull && this.ensureSuccess) response.ensureSuccess();

		if (typeof this.postprocess === "function") await this.postprocess(response);
		return [response, isNull];
	}

	/** @returns The XMLHttpRequest */
	public send(): XMLHttpRequest {
		const request = new XMLHttpRequest();
		if (!this.requestInit.method) throw new Error("Request method must be set");
		request.open(this.requestInit.method, this.requestUri, true);

		if (this.requestInit.credentials === "include") request.withCredentials = true;
		if (this.requestInit.body instanceof ReadableStream) throw new Error("Request body cannot be ReadableStream when using XHR");

		request.send(this.requestInit.body);
		return request;
	}

	/** The request body deserialized as a JSON object */
	public async fromJSONObject<TResult>(deserialize: Deserialize<TResult>, signal?: AbortSignal): Promise<TResult> {
		const response = await this.fetch(signal);
		const json = await response.json();
		return deserialize(json);
	}

	/** The request body deserialized as a JSON object or null if 204 */
	public async fromJSONObjectNullable<TResult>(deserialize: Deserialize<TResult>, signal?: AbortSignal): Promise<TResult | null> {
		const [response, isNull] = await this.fetchNullable(signal);
		if (isNull) return null;

		const json = await response.json();
		return deserialize(json);
	}

	/** The request body deserialized as a JSON array */
	public async fromJSONArray<TResult>(deserialize: Deserialize<TResult>, signal?: AbortSignal): Promise<TResult[]> {
		const response = await this.fetch(signal);
		const json = await response.json();
		return ensureArray(json).map(deserialize);
	}

	/** The request body deserialized as a JSON array or null if 204 */
	public async fromJSONArrayNullable<TResult>(deserialize: Deserialize<TResult>, signal?: AbortSignal): Promise<TResult[] | null> {
		const [response, isNull] = await this.fetchNullable(signal);
		if (isNull) return null;

		const json = await response.json();
		return ensureArray(json).map(deserialize);
	}

	/** The request body deserialized as string */
	public async fromString(signal?: AbortSignal): Promise<string> {
		const response = await this.fetch(signal);
		return await response.text();
	}

	/** The request body deserialized as string */
	public async fromStringNullable(signal?: AbortSignal): Promise<string | null> {
		const [response, isNull] = await this.fetchNullable(signal);
		if (isNull) return null;
		return await response.text();
	}

	/** The request body deserialized as number */
	public async fromNumber(signal?: AbortSignal): Promise<number> {
		const content = await this.fromString(signal);
		return ensureNumber(content);
	}

	/** The request body deserialized as number or null if 204 */
	public async fromNumberNullable(signal?: AbortSignal): Promise<number | null> {
		const content = await this.fromStringNullable(signal);
		if (!content) return null;
		return ensureNumber(content);
	}

	/** The request body deserialized as bigint */
	public async fromBigint(signal?: AbortSignal): Promise<bigint> {
		const content = await this.fromString(signal);
		return ensureBigint(content);
	}

	/** The request body deserialized as number or null if 204 */
	public async fromBigintNullable(signal?: AbortSignal): Promise<bigint | null> {
		const content = await this.fromStringNullable(signal);
		if (!content) return null;
		return ensureBigint(content);
	}

	/** The request body deserialized as boolean */
	public async fromBoolean(signal?: AbortSignal): Promise<boolean> {
		const content = await this.fromString(signal);
		return ensureBoolean(content);
	}

	/** The request body deserialized as boolean or null if 204 */
	public async fromBooleanNullable(signal?: AbortSignal): Promise<boolean | null> {
		const content = await this.fromStringNullable(signal);
		if (!content) return null;
		return ensureBoolean(content);
	}

	/** The request body deserialized as Date */
	public async fromDateString(signal?: AbortSignal): Promise<Date> {
		const content = await this.fromString(signal);
		return ensureDateString(content);
	}

	/** The request body deserialized as Date or null if 204 */
	public async fromDateStringNullable(signal?: AbortSignal): Promise<Date | null> {
		const content = await this.fromStringNullable(signal);
		if (!content) return null;
		return ensureDateString(content);
	}
}
