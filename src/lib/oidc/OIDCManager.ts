import type { OIDCConfiguration, OIDCConfigurations } from "$lib/oidc/protocol.js";
import { indefinitePromise } from "$lib/async/index.js";

interface SignInState {
	codeVerifier: string;
	scope: string;
}

export class OIDCManager<TAudience extends string> {
	public configurations: OIDCConfigurations<TAudience>;

	public constructor(configurations: OIDCConfigurations<TAudience>) {
		this.configurations = configurations;
		this.accessTokens = {} as Record<TAudience, string | undefined>;
		for (const key of Object.keys(this.configurations) as TAudience[]) {
			try {
				const user = JSON.parse(window.localStorage.getItem("OIDC_" + key) ?? "");
				this.accessTokens[key] = user["access_token"];
			} catch {
				this.accessTokens[key] = void 0;
			}
		}
	}

	public readonly accessTokens: Record<TAudience, string | undefined>;

	public async getAccessToken(audience: TAudience): Promise<string | null> {
		try {
			if (this.promises.has(audience)) await this.promises.get(audience);
			else {
				const promise = this.signInIFrame(this.configurations[audience]);
				this.promises.set(audience, promise);
				await promise;
			}
			const user = JSON.parse(window.localStorage.getItem(audience) ?? "");
			return user["access_token"];
		} catch (e) {
			console.warn("Unable to acquire token silently", e);
			return null;
		}
	}

	public async signIn(audience: TAudience): Promise<never> {
		const uri = await this.buildAuthorizeUri(this.configurations[audience]);
		if (uri) {
			window.location.href = uri.toString();
		} else {
			console.warn("Could not redirect to authorization endpoint");
		}

		return await indefinitePromise<never>();
	}

	public promptSignIn(audience: TAudience): void {
		this.configurations.onSignInPrompt(audience);
	}

	/** TODOC */
	private async getOidcConfiguration(uri: string): Promise<Record<string, unknown>> {
		const res = await fetch(uri, { method: "GET", headers: { Accept: "application/json" } });
		if (res.ok) return res.json();
		else return {};
	}

	/** TODOC */
	private base64URLEncode(bytes: Uint8Array): string {
		return btoa(String.fromCharCode.apply(null, Array.from(bytes)))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	}

	/** TODOC */
	private async sha256(input: string): Promise<number[]> {
		// Convert the string to a buffer
		const msgBuffer = new TextEncoder().encode(input);
		// Hash the buffer
		const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
		// Convert ArrayBuffer to Array
		return Array.from(new Uint8Array(hashBuffer));
	}

	private async buildAuthorizeUri(configuration: OIDCConfiguration): Promise<URL | null> {
		const oidcConfiguration = await this.getOidcConfiguration(configuration.metadataAddress);
		if ("authorization_endpoint" in oidcConfiguration && typeof oidcConfiguration["authorization_endpoint"] === "string") {
			const url = new URL(oidcConfiguration["authorization_endpoint"]);

			const buffer = new Uint8Array(32);
			window.crypto.getRandomValues(buffer);
			const codeVerifier = this.base64URLEncode(buffer);

			const state = window.crypto.randomUUID();
			window.localStorage.setItem(state, JSON.stringify({ codeVerifier, scope: configuration.scopeSets[0] }));

			const codeChallenge = this.base64URLEncode(new Uint8Array(await this.sha256(codeVerifier)));

			url.searchParams.append("client_id", configuration.clientId);
			url.searchParams.append("scope", configuration.scopeSets[0]);
			url.searchParams.append("redirect_uri", configuration.redirectUri);
			url.searchParams.append("state", state);
			url.searchParams.append("code_challenge", codeChallenge);
			url.searchParams.append("code_challenge_method", "S256");
			url.searchParams.append("response_mode", "query");
			url.searchParams.append("response_type", "code");

			return url;
		}

		return null;
	}

	/** TODOC */
	public async signInCallback(audience: TAudience): Promise<void> {
		const configuration = this.configurations[audience];
		const oidcConfiguration = await this.getOidcConfiguration(configuration.metadataAddress);
		if ("token_endpoint" in oidcConfiguration && typeof oidcConfiguration["token_endpoint"] === "string") {
			const searchParams = new URLSearchParams(window.location.search);
			const err = searchParams.get("error");
			if (err) throw new Error(err);

			const code = searchParams.get("code") ?? "";
			const state = searchParams.get("state") ?? "";

			const signInState = JSON.parse(window.localStorage.getItem(state) ?? "{}") as SignInState;
			window.localStorage.removeItem(state);

			const formData = new FormData();
			formData.append("client_id", configuration.clientId);
			formData.append("scope", signInState.scope);
			formData.append("redirect_uri", configuration.redirectUri);
			formData.append("code", code);
			formData.append("code_verifier", signInState.codeVerifier);
			formData.append("grant_type", "authorization_code");

			const res = await fetch(oidcConfiguration["token_endpoint"], { method: "POST", body: formData });
			const json = await res.json();
			if (!("access_token" in json)) throw json;

			window.localStorage.setItem("OIDC_" + audience, JSON.stringify(json));

			if (window !== window.parent) {
				window.parent.postMessage("signedIn");
			}
		}
	}

	/** TODOC */
	private async signInIFrame(configuration: OIDCConfiguration): Promise<void> {
		const uri = await this.buildAuthorizeUri(configuration);
		if (!uri) return;

		const iframe = document.createElement("iframe");
		uri.searchParams.append("prompt", "none");
		iframe.src = uri.toString();

		const promise = new Promise<void>((resolve, reject) => {
			window.addEventListener("message", (e) => {
				if (e.data === "signedIn") {
					iframe.remove();
					resolve();
				} else if (e.data === "failSignIn") {
					iframe.remove();
					reject();
				}
			});
			iframe.addEventListener("error", (e) => {
				iframe.remove();
				reject(e);
			});
			iframe.contentWindow?.addEventListener("unhandledrejection", (e) => {
				iframe.remove();
				reject("");
			});
			document.body.appendChild(iframe);
		});

		await promise;
	}

	private promises: Map<TAudience, Promise<void>> = new Map();
}
