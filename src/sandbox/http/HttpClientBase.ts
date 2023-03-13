import type { UnknownObject } from "../../lib/shared/UnknownObject";
import { ensureArray, ensureObject } from "../../lib/shared/UnknownObject";

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

export abstract class HttpClientBase {
	protected baseAddress?: string;

	protected constructor(baseAddress?: string) {
		this.baseAddress = baseAddress;
	}

	public buildURL(path = ""): URL | string {
		return `${this.baseAddress}/${path}`;
	}

	protected async get(path = ""): Promise<Response> {
		return await fetch(this.buildURL(path));
	}

	protected async getFromJsonObject(requestPath: string): Promise<UnknownObject> {
		const res = await this.get(requestPath);
		return ensureObject(await res.ensureSuccess().json());
	}

	protected async getFromJsonArray(requestPath: string): Promise<unknown[]> {
		const res = await this.get(requestPath);
		return ensureArray(await res.ensureSuccess().json());
	}
}
