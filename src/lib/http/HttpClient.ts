import { ValidationError } from "./ValidationErrors";
import { ensureArray } from "../shared/UnknownObject";

declare global {
	interface Response {
		/** Throw error if status code does not indicate success */
		ensureSuccess(): Response;

		/** Throw error if status code is Bad Request */
		validationErrors(): Promise<Response>;
	}
}

/** @inheritdoc */
Response.prototype.ensureSuccess = function (): Response {
	if (!this.ok) {
		throw new Error(`Expected status code indicating success, got: ${this.status} ${this.statusText}`);
	}
	return this;
};

/** @inheritdoc */
Response.prototype.validationErrors = async function (): Promise<Response> {
	if (this.status === 400) {
		const json = await this.json();
		throw new ValidationError(json.errors);
	}
	return this;
};

/** */
type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** */
type HTTPContent = JSONStringify | BodyInit | null;

/** Function to turn something into a JSON string */
export type JSONStringify = () => string;

/** */
export interface IHttpClientOptions {
	defaultRequestInit: RequestInit;
	preprocess: (requestInit: RequestInit) => Promise<RequestInit>;
	postprocess: (response: Response) => Promise<Response>;
}

/** Class to handle HTTP requests (`fetch`/`XHR`) */
export class HttpClient {
	/** */
	private readonly baseAddress: URL | null = null;

	/** */
	private readonly defaultInit: RequestInit;

	/** */
	private readonly preprocess: (requestInit: RequestInit) => Promise<RequestInit>;

	/** */
	private readonly postprocess: (response: Response) => Promise<Response>;

	/** */
	public constructor(baseAddress = "", options: Partial<IHttpClientOptions> = {}) {
		this.defaultInit = options.defaultRequestInit ?? {};
		this.preprocess = typeof options.preprocess === "function" ? options.preprocess : async (requestInit) => requestInit;
		this.postprocess = typeof options.postprocess === "function" ? options.postprocess : async (response) => response;
		try {
			this.baseAddress = new URL(baseAddress);
		} catch (e) {
			console.warn("Base address could not be constructed from constructor");
		}
	}

	/** Combine `baseAddress` with `requestUri` in the same fashion as .NET `Uri` */
	private buildURI(requestUri: string): string {
		if (this.baseAddress === null) {
			if (requestUri.startsWith("https://") || requestUri.startsWith("http://")) return requestUri;
			throw new Error("When baseAddress is not set, requestUris must be a fully qualified URI");
		}

		if (this.baseAddress.href.endsWith("/")) {
			if (requestUri.startsWith("/")) return this.baseAddress.host + requestUri;
			else return this.baseAddress.href + requestUri;
		} else {
			if (requestUri.startsWith("/")) return this.baseAddress.href + requestUri;
			else return this.baseAddress.host + "/" + requestUri;
		}
	}

	/** */
	private async buildRequestInit(method: HTTPMethod, content: HTTPContent, requestInit?: RequestInit, abort?: AbortSignal): Promise<RequestInit> {
		const headers = new Headers(this.defaultInit.headers);
		let body: BodyInit | null = null;

		function isNativeContent(content: HTTPContent): content is BodyInit | null {
			if (
				content === null ||
				content instanceof ReadableStream ||
				content instanceof Blob ||
				content instanceof ArrayBuffer ||
				content instanceof FormData ||
				content instanceof URLSearchParams ||
				typeof content === "string" ||
				("buffer" in content && content instanceof ArrayBuffer)
			) {
				return true;
			}
			return false;
		}

		let json = false;
		if (!isNativeContent(content)) {
			if (typeof content === "function") {
				body = content();
				json = true;
			} else if (Array.isArray(content)) {
				body = JSON.stringify(content);
				json = true;
			} else if (typeof content === "object") {
				body = JSON.stringify(content);
				json = true;
			}
		}

		if (json) headers.append("Content-Type", "application/json");
		return await this.preprocess({ ...this.defaultInit, headers, body, method, signal: abort, ...requestInit });
	}

	/** Make an HTTP request
	 * @returns The Response */
	public async send(requestUri: string, method: HTTPMethod, content: HTTPContent, requestInit?: RequestInit, abort?: AbortSignal): Promise<Response> {
		const init = await this.buildRequestInit(method, content, requestInit, abort);
		const res = await fetch(this.buildURI(requestUri), init);
		return await this.postprocess(res);
	}

	/** Make a GET request
	 * @returns The Response if success */
	public async get(requestUri: string, requestInit?: RequestInit, signal?: AbortSignal): Promise<Response> {
		const res = await this.send(requestUri, "GET", null, requestInit, signal);
		return res.ensureSuccess();
	}

	/** Make a DELETE request
	 * @returns The Response if success */
	public async delete(requestUri: string, requestInit?: RequestInit, signal?: AbortSignal): Promise<Response> {
		const res = await this.send(requestUri, "DELETE", null, requestInit, signal);
		return res.ensureSuccess();
	}

	/** Make a POST request
	 * @returns The Response if success */
	public async post(requestUri: string, content: HTTPContent, requestInit?: RequestInit, signal?: AbortSignal): Promise<Response> {
		const res = await this.send(requestUri, "POST", content, requestInit, signal);
		return res.ensureSuccess();
	}

	/** Make a PATCH request
	 * @returns The Response if success */
	public async patch(requestUri: string, content: HTTPContent, requestInit?: RequestInit, signal?: AbortSignal): Promise<Response> {
		const res = await this.send(requestUri, "PATCH", content, requestInit, signal);
		return res.ensureSuccess();
	}

	/** Make a PUT request
	 * @returns The Response if success */
	public async put(requestUri: string, content: HTTPContent, requestInit?: RequestInit, signal?: AbortSignal): Promise<Response> {
		const res = await this.send(requestUri, "PUT", content, requestInit, signal);
		return res.ensureSuccess();
	}

	/** */
	public async getFromArray<TValue>(requestUri: string, transform: (something: unknown) => TValue, signal?: AbortSignal): Promise<TValue[]> {
		const res = await this.send(requestUri, "GET", null, undefined, signal);
		const json = ensureArray(await res.ensureSuccess().json());
		return json.map((something) => transform(something));
	}

	/** */
	public async getFromArrayNullable<TValue>(requestUri: string, transform: (something: unknown) => TValue, signal?: AbortSignal): Promise<TValue[] | null> {
		const res = await this.send(requestUri, "GET", null, undefined, signal);
		const json = ensureArray(await res.ensureSuccess().json());
		return json.map((something) => transform(something));
	}

	/** Make a POST request using XMLHttpRequest */
	public postLargeFile(path = "", name: string, file: File, init: (request: XMLHttpRequest) => void): void {
		const request = new XMLHttpRequest();
		request.open("POST", this.buildURI(path), true);

		request.withCredentials = true;
		const formData = new FormData();
		formData.append("file", file, name);

		init(request);

		request.send(formData);
	}
}
