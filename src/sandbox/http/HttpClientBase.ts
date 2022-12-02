declare global {
	interface Response {
		ensureSuccess(): Response;

		getFromJsonArray<T>(ctor: (el: unknown) => T): Promise<T[]>;

		getFromJson<T>(ctor: (el: unknown) => T): Promise<T>;
	}
}

Response.prototype.ensureSuccess = function (): Response {
	if (!this.ok) {
		throw new Error(`Expected status code indicating success, got: ${this.status} ${this.statusText}`);
	}
	return this;
};

Response.prototype.getFromJsonArray = async function <T>(ctor: (el: unknown) => T): Promise<T[]> {
	const json = await this.json();
	if (!Array.isArray(json)) {
		throw new Error(`Expected body to be a JSON array, got: ${typeof json}`);
	}
	return json.map(ctor);
};

Response.prototype.getFromJson = async function <T>(ctor: (el: unknown) => T): Promise<T> {
	const json = await this.json();
	if (typeof json !== "object") {
		throw new Error(`Expected body to be a JSON object, got: ${typeof json}`);
	}
	return ctor(json);
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
}
