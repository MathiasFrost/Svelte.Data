import type { OIDCConfigurations } from "$lib/oidc/OIDCConfiguration.js";
import { indefinitePromise } from "$lib/async/index.js";
import { HTTPClient, type Postprocess, type Preprocess } from "$lib/http/index.js";
import { ensureString } from "$lib/types/index.js";

interface SignInState {
	codeVerifier: string;
	scope: string;
	audience: string;
}

export class OIDCManager<TAudience extends string> {
	public configurations: OIDCConfigurations<TAudience>;

	public constructor(configurations: OIDCConfigurations<TAudience>) {
		this.configurations = configurations;
	}

	public async getAccessToken(audience: TAudience): Promise<string | null> {
		try {
			const user = JSON.parse(window.localStorage.getItem(`OIDC_${audience}`) ?? "");
			return ensureString(user["access_token"]);
		} catch {
			/* empty */
		}

		try {
			if (this.promises.has(audience)) await this.promises.get(audience);
			else {
				const promise = this.signInIFrame(audience);
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
		const uri = await this.buildAuthorizeUri(audience);
		if (uri) {
			window.location.href = uri.toString();
		} else {
			console.warn("Could not redirect to authorization endpoint");
		}

		return await indefinitePromise<never>();
	}

	public promptSignIn(audience: TAudience): void {
		this.configurations[audience].onSignInPrompt(audience);
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

	private async buildAuthorizeUri(audience: TAudience): Promise<URL | null> {
		const configuration = this.configurations[audience];
		const oidcConfiguration = await this.getOidcConfiguration(`${configuration.authority}/.well-known/openid-configuration`);
		if ("authorization_endpoint" in oidcConfiguration && typeof oidcConfiguration["authorization_endpoint"] === "string") {
			const url = new URL(oidcConfiguration["authorization_endpoint"]);

			const buffer = new Uint8Array(32);
			window.crypto.getRandomValues(buffer);
			const codeVerifier = this.base64URLEncode(buffer);

			const state = window.crypto.randomUUID();
			window.localStorage.setItem(state, JSON.stringify({ codeVerifier, scope: configuration.scope, audience }));

			const codeChallenge = this.base64URLEncode(new Uint8Array(await this.sha256(codeVerifier)));

			url.searchParams.append("client_id", configuration.clientId);
			url.searchParams.append("scope", configuration.scope);
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
	public async signInCallback(): Promise<void> {
		try {
			const searchParams = new URLSearchParams(window.location.search);
			const err = searchParams.get("error");
			if (err) throw new OIDCError(err);

			const code = searchParams.get("code") ?? "";
			const state = searchParams.get("state") ?? "";

			const signInState = JSON.parse(window.localStorage.getItem(state) ?? "{}") as SignInState;
			window.localStorage.removeItem(state);

			// @ts-ignore
			const configuration = this.configurations[signInState.audience];
			const oidcConfiguration = await this.getOidcConfiguration(`${configuration.authority}/.well-known/openid-configuration`);
			if ("token_endpoint" in oidcConfiguration && typeof oidcConfiguration["token_endpoint"] === "string") {
				const formData = new FormData();
				formData.append("client_id", configuration.clientId);
				formData.append("scope", signInState.scope);
				formData.append("redirect_uri", configuration.redirectUri);
				formData.append("code", code);
				formData.append("code_verifier", signInState.codeVerifier);
				formData.append("grant_type", "authorization_code");

				const res = await fetch(oidcConfiguration["token_endpoint"], { method: "POST", body: formData });
				const json = await res.json();
				if (!("access_token" in json)) throw new OIDCError(json);

				window.localStorage.setItem(`OIDC_${signInState.audience}`, JSON.stringify(json));

				if (window !== window.parent) {
					window.parent.postMessage("signedIn");
				}
			}
		} catch (e) {
			const oidcError = new OIDCError();
			if (e instanceof Error) {
				oidcError.message = e.message;
				oidcError.name = e.name;
				oidcError.stack = e.stack;
				oidcError.cause = e.cause;
			}
			window.parent.postMessage({ type: "error", details: oidcError }, "*");
		}
	}

	/** TODOC */
	private async signInIFrame(audience: TAudience): Promise<void> {
		const uri = await this.buildAuthorizeUri(audience);
		if (!uri) return;
		// throw new Error();
		const iframe = document.createElement("iframe");
		uri.searchParams.append("prompt", "none");
		iframe.src = uri.toString();

		const promise = new Promise<void>((resolve, reject) => {
			function handleMessage(e: MessageEvent) {
				if (e.data === "signedIn") {
					resolve();
					cleanup();
				} else if (e.data.type === "error") {
					reject(e.data.details);
					cleanup();
				}
			}

			function cleanup() {
				window.removeEventListener("message", handleMessage);
				iframe.remove();
			}

			window.addEventListener("message", handleMessage);
			document.body.appendChild(iframe);
		});

		await promise;
	}

	private promises: Map<TAudience, Promise<void>> = new Map();

	public createHttpClient(baseAddress: string, audience: TAudience): HTTPClient {
		/** Attach access_token if exists
		 * @notes Rather than pre-emptively making sure our access_token is valid, we send the request first, then react to 401 or 403 */
		const preprocess: Preprocess = async (requestInit) => {
			const headers = new Headers({ ...requestInit.headers });
			const accessToken = await this.getAccessToken(audience);
			if (accessToken) headers.append("Authorization", `Bearer ${accessToken}`);
			requestInit.headers = headers;
		};

		/** Try to acquire a token once if we get 401 or 403
		 * @notes It is recommended to not initialize a request if the user does not have access to the resource. If 401 or 403 happens, we assume the user's token needs to be re-acquired */
		const postprocess: Postprocess = async (response, nullable, retry, retryCount) => {
			if (!nullable && [401, 403].includes(response.status)) {
				if (typeof window !== "undefined") {
					if (retryCount < 1) {
						if (await this.getAccessToken(audience)) {
							return await retry();
						} else {
							this.promptSignIn(audience);
						}
					}
				}
				await indefinitePromise<never>();
			}
			return null;
		};
		return new HTTPClient(baseAddress, { redirect: "manual" }, preprocess, postprocess);
	}
}

class OIDCError extends Error {}
