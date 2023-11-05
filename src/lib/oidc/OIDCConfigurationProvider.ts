import { ensureObject, ensureString } from "$lib/types/index.js";
import type { Fetch } from "$lib/http";

/** Class for managing OIDC configurations */
export class OIDCConfigurationProvider {
	/** Cached configurations */
	private _configurations = new Map<string, OIDCDocument>();

	/** @see window.fetch */
	private readonly fetch: Fetch;

	/** ctor */
	public constructor(fetch?: Fetch) {
		if (fetch) this.fetch = fetch;
		if (typeof window === "undefined") throw new Error("No server-fetch supplied");
		this.fetch = window.fetch;
	}

	/** @param authority OIDC provider's authority URI whose openid-configuration document we want to fetch
	 * @param metadataUri Fully qualified URI to the openid-configuration document. Will be inferred from authority if not specified
	 * @returns The openid-configuration document */
	public async get(authority: string, metadataUri: string | null = null): Promise<OIDCDocument> {
		const cached = this._configurations.get(authority);
		if (cached) return cached;

		metadataUri ??= `${authority}/.well-known/openid-configuration`;
		const res = await this.fetch(metadataUri);
		const o = ensureObject(await res.json());
		const config: OIDCDocument = {
			tokenEndpoint: ensureString(o["token_endpoint"]),
			authorizationEndpoint: ensureString(o["authorization_endpoint"])
		};

		this._configurations.set(authority, config);
		return config;
	}
}

/** openid-configuration document */
interface OIDCDocument {
	/** Endpoint to fetch access_tokens */
	tokenEndpoint: string;

	/** Endpoint to authorize the user against the OIDC provider */
	authorizationEndpoint: string;
}
