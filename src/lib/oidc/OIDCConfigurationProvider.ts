import { ensureObject, ensureString } from "$lib/types/unknown.js";
import type { Fetch } from "$lib/http/Fetch.js";

/** Class for managing OIDC configurations */
export class OIDCConfigurationProvider {
	/** Cached configurations */
	private _configurations = new Map<string, OIDCDocument>();

	/** @param fetch Which fetch to use
	 *  @param authority OIDC provider's authority URI whose openid-configuration document we want to fetch
	 * @param metadataUri Fully qualified URI to the openid-configuration document. Will be inferred from authority if not specified
	 * @returns The openid-configuration document */
	public async get(fetch: Fetch, authority: string, metadataUri: string | null = null): Promise<OIDCDocument> {
		const cached = this._configurations.get(authority);
		if (cached) return cached;

		metadataUri ??= `${authority}/.well-known/openid-configuration`;
		const res = await fetch(metadataUri);
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
