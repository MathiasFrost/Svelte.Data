import { ensureObject } from "$lib/utils/unknown.js";

/** Message from the OIDC token endpoint */
export class OIDCMessage {
	/** OIDC protocol access_token */
	public readonly accessToken: string | null = null;

	/** OIDC protocol refresh_token */
	public readonly refreshToken: string | null = null;

	/** OIDC protocol expires_in */
	public readonly expiresIn: number | null = null;

	/** OIDC protocol id_token */
	public readonly idToken: string | null = null;

	/** @param something The JSON in string form, anonymous object or, if neither, will just initialize fields with null */
	public constructor(something?: unknown) {
		if (typeof something === "undefined") return;
		let o: Record<string, unknown>;
		if (typeof something === "string") {
			try {
				o = ensureObject(JSON.parse(something));
			} catch {
				return;
			}
		} else if (something) {
			o = ensureObject(something);
		} else return;
		this.accessToken = typeof o["access_token"] === "string" ? o["access_token"] : null;
		this.idToken = typeof o["id_token"] === "string" ? o["id_token"] : null;
		this.refreshToken = typeof o["refresh_token"] === "string" ? o["refresh_token"] : null;
		this.expiresIn = typeof o["expires_in"] === "number" ? o["expires_in"] : null;
	}

	/** @inheritDoc */
	public toJSON(): object {
		return {
			access_token: this.accessToken,
			id_token: this.idToken,
			refresh_token: this.refreshToken,
			expires_in: this.expiresIn
		};
	}

	/** @returns True if nonce of the id_token is the same as the supplied nonce */
	public isNonceValid(nonce: string): boolean {
		return this.idTokenObject.nonce === nonce;
	}

	/** @returns The deserialized id_token. Empty object if failed. */
	public get idTokenObject(): Record<string, unknown> {
		if (!this.idToken) return {};
		try {
			return JSON.parse(this.decodeJwt(this.idToken));
		} catch (e) {
			console.warn("Unable to deserialize id_token ", e);
			return {};
		}
	}

	/** @returns The claims part of the OIDC token (access or id) decoded with UTF-8 */
	private decodeJwt(jwt: string): string {
		return decodeURIComponent(
			atob(jwt.split(".")[1])
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
	}

	/** @returns True if the access_token is present and not expired */
	public get hasValidAccessToken(): boolean {
		// If we have no access_token it can't be valid
		if (!this.accessToken) return false;

		// If we have access_token but no expires_in we just assume it is valid
		if (!this.expiresIn) return true;

		const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
		const tokenExpiresAt = currentTime + this.expiresIn;

		// If expired try to refresh
		return currentTime < tokenExpiresAt;
	}
}
