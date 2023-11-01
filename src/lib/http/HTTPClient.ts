import { HTTPRequestBuilder } from "./HTTPRequestBuilder.js";
import { ValidationError } from "./ValidationError.js";
import type { HTTPClientOptions } from "$lib/http/HTTPClientOptions.js";

declare global {
	interface Response {
		/** Throw error if status code is Bad Request */
		validationErrors(): Promise<Response>;
	}
}

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
	/** Base address for requests made with this client */
	public readonly baseAddress: URL | null = null;

	/** @see HTTPClientOptions */
	private readonly options: HTTPClientOptions;

	/** ctor */
	public constructor(baseAddress = "", options: Partial<HTTPClientOptions> = {}) {
		try {
			this.baseAddress = new URL(baseAddress);
		} catch (e) {
			console.warn("Base address could not be constructed from constructor");
		}
		this.options = options;
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
