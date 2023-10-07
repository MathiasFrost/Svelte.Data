import { ensureObject, ensureString } from "$lib/types/index.js";

export class OIDCConfigurationProvider {
	private _configurations = new Map<string, OIDCDocument>();

	public async get(authority: string, metadataUri: string | null = null): Promise<OIDCDocument> {
		if (typeof window === "undefined") throw new Error("Can't call this server-side");

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

interface OIDCDocument {
	tokenEndpoint: string;
	authorizationEndpoint: string;
}
