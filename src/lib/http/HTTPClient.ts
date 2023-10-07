import { HTTPRequestBuilder } from "./HTTPRequestBuilder.js";
import { ValidationError } from "./ValidationError.js";
import type { HTTPClientOptions } from "$lib/http/HTTPClientOptions.js";

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

// noinspection JSUnusedGlobalSymbols
/** Class to handle HTTP requests (`fetch`/`XHR`) */
export class HTTPClient {
	/** TODOC */
	public readonly baseAddress: URL | null = null;

	/** @see HTTPClientOptions */
	private readonly options: HTTPClientOptions;

	/** TODOC */
	public constructor(baseAddress = "", options: Partial<HTTPClientOptions> = {}) {
		try {
			this.baseAddress = new URL(baseAddress);
		} catch (e) {
			console.warn("Base address could not be constructed from constructor");
		}
		this.options = options;
	}

	/** TODOC */
	public get(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "GET", requestUri, ensureSuccess, this.options);
	}

	/** TODOC */
	public post(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "POST", requestUri, ensureSuccess, this.options);
	}

	/** TODOC */
	public put(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "PUT", requestUri, ensureSuccess, this.options);
	}

	/** TODOC */
	public patch(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "PATCH", requestUri, ensureSuccess, this.options);
	}

	/** TODOC */
	public delete(requestUri: string, ensureSuccess = true): HTTPRequestBuilder {
		return new HTTPRequestBuilder(this.baseAddress, "DELETE", requestUri, ensureSuccess, this.options);
	}
}
