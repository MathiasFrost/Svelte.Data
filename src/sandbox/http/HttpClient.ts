import type {UnknownObject} from "../../lib/shared/UnknownObject";
import {ensureArray, ensureBoolean, ensureObject} from "../../lib/shared/UnknownObject";

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

/** An HttpClient modelled after .NET HttpClient */
export class HttpClient {
    private readonly baseAddress: URL | null = null;
    private readonly requestInit: RequestInit;

    public constructor(baseAddress = "", requestInit: RequestInit | "APIClient" = {}) {
        this.requestInit = requestInit === "APIClient" ? {credentials: "include", redirect: "manual"} : requestInit;
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

        if (this.baseAddress.href.endsWith('/')) {
            if (requestUri.startsWith('/')) return this.baseAddress.host + requestUri;
            else return this.baseAddress.href + requestUri;
        } else {
            if (requestUri.startsWith('/')) return this.baseAddress.href + requestUri;
            else return this.baseAddress.host + "/" + requestUri;
        }
    }

    private buildRequestInit(content: JSONString | BodyInit | null, method: string): RequestInit {
        const headers = new Headers(this.requestInit.headers);
        let body: BodyInit | null = null;

        let json = false;
        if (content instanceof JSONString) {
            body = content.stringify();
            json = true;
        } else if (Array.isArray(content)) {
            body = JSON.stringify(content);
            json = true;
        } else if (typeof content === "object" && content !== null) {
            body = JSON.stringify(content)
            json = true;
        }

        if (json) headers.append("Content-Type", "application/json");
        return {...this.requestInit, headers, body, method};

    }

    public async postAsJson(requestUri: string, content: JSONString | BodyInit | null): Promise<void> {
        const res = await fetch(this.buildURL(requestUri), this.buildRequestInit(content, "POST"));
        res.ensureSuccess();
    }

    public async getResponse(requestUri: string): Promise<Response> {
        return await fetch(this.buildURL(requestUri));
    }

    public async get(requestUri: string): Promise<void> {
        const res = await this.getResponse(requestUri);
        res.ensureSuccess();
    }

    public async getFromBoolean(requestUri: string): Promise<boolean> {
        const res = await this.getResponse(requestUri);
        const str = (await res.ensureSuccess().text()).toLowerCase();
        return ensureBoolean(str === "true" ? true : str === "false" ? false : undefined);
    }

    public async getFromJsonObject<TValue>(requestUri: string, transform: (something: unknown) => TValue): Promise<TValue> {
        const res = await this.getResponse(requestUri);
        return transform(ensureObject(await res.ensureSuccess().json()));
    }

    public async getFromObject(requestUri: string): Promise<UnknownObject> {
        const res = await this.getResponse(requestUri);
        return ensureObject(await res.json());
    }

    public async getFromArray(requestUri: string): Promise<unknown[]> {
        const res = await this.getResponse(requestUri);
        return ensureArray(await res.json());
    }

    public async getFromJsonArray<TValue>(requestUri: string, transform: (something: unknown) => TValue): Promise<TValue[]> {
        const res = await this.getResponse(requestUri);
        const json = ensureArray(await res.ensureSuccess().json());
        return json.map(something => transform(something));
    }
}

/** */
export class JSONString {
    /** */
    public stringify: () => string;

    /** */
    constructor(stringify: () => string) {
        this.stringify = stringify;
    }
}
