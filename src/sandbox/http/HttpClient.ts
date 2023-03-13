import type { UnknownObject } from "../../lib/shared/UnknownObject";
import { ensureArray, ensureBoolean, ensureObject } from "../../lib/shared/UnknownObject";

declare global {
	interface Response {
		ensureSuccess(): Response;
	}
}

Response.prototype.ensureSuccess = function (): Response {
	if (!this.ok) {
		throw new Error(`Expected status code indicating success, got: ${this.status} ${this.statusText}`);
	}
	return this;
};

/** */
type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** An HttpClient modelled after .NET HttpClient */
export class HttpClient {
	private readonly baseAddress: URL | null = null;
	private readonly defaultInit: RequestInit;
	private readonly preprocessor: (init: RequestInit) => RequestInit;

	/** Default init for calling a protected API */
	public static ApiInit: RequestInit = { redirect: "manual", credentials: "include" };

	public constructor(baseAddress = "", defaultRequestInit: RequestInit = {}, preprocessor?: (init: RequestInit) => RequestInit) {
		this.defaultInit = defaultRequestInit;
		this.preprocessor = typeof preprocessor === "function" ? preprocessor : (init) => init;
		try {
			this.baseAddress = new URL(baseAddress);
		} catch (e) {
			console.warn("Base address could not be constructed from constructor");
		}
	}

	private buildURL(requestUri: string): string {
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

	private buildRequestInit(method: HTTPMethod, content: Stringify | BodyInit | null, abort?: AbortSignal): RequestInit {
		const headers = new Headers(this.defaultInit.headers);
		let body: BodyInit | null = null;

		// eslint-disable-next-line @typescript-eslint/ban-types
		function isNativeContent(content: Stringify | BodyInit | null): content is BodyInit | null {
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
			} else if (typeof content === "object" && content !== null) {
				body = JSON.stringify(content);
				json = true;
			}
		}

		if (json) headers.append("Content-Type", "application/json");
		return this.preprocessor({ ...this.defaultInit, headers, body, method, signal: abort });
	}

	public async postAsJson(requestUri: string, content: Stringify | BodyInit | null): Promise<void> {
		const res = await fetch(this.buildURL(requestUri), this.buildRequestInit("POST", content));
		res.ensureSuccess();
	}

	public async send(requestUri: string, method: HTTPMethod, content: Stringify | BodyInit | null, abort?: AbortSignal): Promise<Response> {
		return await fetch(this.buildURL(requestUri), this.buildRequestInit(method, content, abort));
	}

	public async get(requestUri: string): Promise<void> {
		const res = await this.send(requestUri);
		res.ensureSuccess();
	}

	public async getFromBoolean(requestUri: string): Promise<boolean> {
		const res = await this.send(requestUri);
		const str = (await res.ensureSuccess().text()).toLowerCase();
		return ensureBoolean(str === "true" ? true : str === "false" ? false : undefined);
	}

	public async getFromJsonObject<TValue>(requestUri: string, transform: (something: unknown) => TValue): Promise<TValue> {
		const res = await this.send(requestUri);
		return transform(ensureObject(await res.ensureSuccess().json()));
	}

	public async getFromObject(requestUri: string): Promise<UnknownObject> {
		const res = await this.send(requestUri);
		return ensureObject(await res.json());
	}

	public async getFromArray(requestUri: string): Promise<unknown[]> {
		const res = await this.send(requestUri);
		return ensureArray(await res.json());
	}

	public async getFromJsonArray<TValue>(requestUri: string, transform: (something: unknown) => TValue): Promise<TValue[]> {
		const res = await this.send(requestUri);
		const json = ensureArray(await res.ensureSuccess().json());
		return json.map((something) => transform(something));
	}
}

/** */
export type Stringify = () => string;
