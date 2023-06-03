import { HTTPRequestBuilder } from "./HTTPRequestBuilder.js";
import type { Postprocess } from "./Postprocess.js";
import type { Preprocess } from "./Preprocess.js";
import { ValidationError } from "./ValidationError.js";

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

/** Class to handle HTTP requests (`fetch`/`XHR`) */
export class HTTPClient {
	/** TODOC */
	public readonly baseAddress: URL | null = null;

	/** @see RequestInit */
	private readonly defaultRequestInit: RequestInit;

	/** @see Preprocess */
	private readonly preprocess?: Preprocess;

	/** @see Postprocess */
	private readonly postprocess?: Postprocess;

	/** TODOC */
	public constructor(baseAddress = "", defaultRequestInit?: RequestInit, preprocess?: Preprocess, postprocess?: Postprocess) {
		try {
			this.baseAddress = new URL(baseAddress);
		} catch (e) {
			console.warn("Base address could not be constructed from constructor");
		}
		this.defaultRequestInit = defaultRequestInit ?? {};
		this.preprocess = preprocess;
		this.postprocess = postprocess;
	}

	/** TODOC */
	public get(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "GET", requestUri, ensureSuccess, this.defaultRequestInit, this.preprocess, this.postprocess);
	}

	/** TODOC */
	public post(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "POST", requestUri, ensureSuccess, this.defaultRequestInit, this.preprocess, this.postprocess);
	}

	/** TODOC */
	public put(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "PUT", requestUri, ensureSuccess, this.defaultRequestInit, this.preprocess, this.postprocess);
	}

	/** TODOC */
	public patch(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "PATCH", requestUri, ensureSuccess, this.defaultRequestInit, this.preprocess, this.postprocess);
	}

	/** TODOC */
	public delete(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "DELETE", requestUri, ensureSuccess, this.defaultRequestInit, this.preprocess, this.postprocess);
	}
}
