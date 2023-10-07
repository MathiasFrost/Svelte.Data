import { ensureObject } from "$lib/types/index.js";

export class OIDCMessage {
	public readonly accessToken: string | null = null;

	public readonly refreshToken: string | null = null;

	public readonly expiresIn: number | null = null;

	public readonly idToken: string | null = null;

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
		return { access_token: this.accessToken, id_token: this.idToken, refresh_token: this.refreshToken, expires_in: this.expiresIn };
	}

	public isNonceValid(nonce: string): boolean {
		return this.idTokenObject.nonce === nonce;
	}

	public get idTokenObject(): Record<string, unknown> {
		if (!this.idToken) return {};
		try {
			return JSON.parse(atob(this.idToken.split(".")[1]));
		} catch (e) {
			console.warn("Unable to deserialize id_token ", e);
			return {};
		}
	}

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
