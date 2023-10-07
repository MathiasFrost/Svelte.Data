import type { OIDCConfigurations } from "$lib/oidc/OIDCConfiguration.js";
import { indefinitePromise } from "$lib/async/index.js";
import { HTTPClient, type Postprocess, type Preprocess } from "$lib/http/index.js";
import { OIDCMessage } from "$lib/oidc/OIDCMessage.js";
import { OIDCConfigurationProvider } from "$lib/oidc/OIDCConfigurationProvider.js";

enum AcquisitionMethod {
	Storage,

	RefreshToken,

	UserInteraction,

	IFrame
}

interface OIDCStatePayload<TAudience extends string> {
	readonly codeVerifier: string;
	readonly audience: TAudience;
	readonly nonce: string;
}

function pk(authority: string, audience: string): string {
	return `${authority} ${audience}`;
}

export class OIDCManager<TAudience extends string> {
	public configurations: OIDCConfigurations<TAudience>;
	private readonly configProvider = new OIDCConfigurationProvider();
	private currentIFramePromise: Promise<void> | null = null;
	private readonly iFramePromises: { key: string; promise: Promise<void> }[] = [];
	private refreshPromises: { [key: string]: Promise<string | null> } = {};

	public constructor(configurations: OIDCConfigurations<TAudience>) {
		this.configurations = configurations;
	}

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

	public async getAccessToken(audience: TAudience): Promise<string | null> {
		if (typeof window === "undefined") {
			console.info("Can't call getAccessToken server-side");
			return null;
		}
		const config = this.configurations[audience];
		const authority = config.authority;
		const key = pk(authority, audience);

		let method: AcquisitionMethod = AcquisitionMethod.Storage;
		// Try all methods from storage retrieval to refresh_token exchange through iframe silent sign-in to user interaction redirect
		while (method <= AcquisitionMethod.UserInteraction) {
			switch (method) {
				case AcquisitionMethod.Storage:
					{
						const oidcMessage = new OIDCMessage(window.localStorage.getItem(key));
						// If we have valid token, all is good
						if (oidcMessage.hasValidAccessToken) {
							console.info(`OIDC '${key}': access_token found in storage and valid. Returning.`);
							return oidcMessage.accessToken;
						} else if (oidcMessage.refreshToken) {
							console.info(`OIDC '${key}': access_token found but invalid. Initiating refresh_token exchange.`);
							method = AcquisitionMethod.RefreshToken;
						}
					}
					break;
				case AcquisitionMethod.RefreshToken:
					{
						const oidcMessage = new OIDCMessage(window.localStorage.getItem(key));
						const refreshTokenResult = await this.refreshToken(oidcMessage.refreshToken, audience);
						if (refreshTokenResult) {
							console.info(`OIDC '${key}': refresh_token exchange successful. Returning new access_token.`);
							return refreshTokenResult;
						} else {
							console.info(`OIDC '${key}': refresh_token exchange failed. Proceeding to iframe.`);
							method = AcquisitionMethod.IFrame;
						}
					}
					break;
				case AcquisitionMethod.IFrame:
					{
						await this.signInIFrame(audience); // This method stores OIDC result in storage if successful
						const oidcMessage = new OIDCMessage(window.localStorage.getItem(key));
						if (oidcMessage.accessToken) {
							console.info(`OIDC '${key}': iframe sign-in successful. Returning new access_token.`);
							return oidcMessage.accessToken;
						} else {
							console.info(`OIDC '${key}': iframe sign-in failed. Proceeding to user interaction.`);
							method = AcquisitionMethod.UserInteraction;
						}
					}
					break;
				case AcquisitionMethod.UserInteraction:
					if (config.autoSignIn)
						await this.signInUserInteraction(audience); // This method uses redirects, meaning this promise will never resolve in this window.
					// Next time getAccessToken is called, if sign-in succeeded, we should be able to retrieve token from storage
					else {
						this.promptSignIn(audience);
						const promise = new Promise<string>((resolve, reject) => {
							this.resolves.push({ key, resolve });
							this.rejects.push({ key, reject });
						});
						return await promise; // We are at a deadlock here, since we have been inquired to return an access_token, but we can't without a redirect.
						// Hence, we just suspend the promise indefinitely unless rejected by user. Or resolved with a valid access_token.
					}
					break;
				default:
					throw new Error("Unexpected code path");
			}
		}
		throw new Error("Unexpected code path");
	}

	private resolves: { key: string; resolve: (accessToken: string) => void }[] = [];
	private rejects: { key: string; reject: () => void }[] = [];

	// noinspection JSUnusedGlobalSymbols
	public rejectPrompt(authority?: string, audience?: TAudience): void {
		if (audience && authority) {
			const key = pk(authority, audience);
			this.rejects.filter((value) => value.key === key).forEach((value) => value.reject());
			this.rejects = this.rejects.filter((value) => value.key !== key);
			this.resolves = this.resolves.filter((value) => value.key !== key);
		} else {
			this.rejects.forEach((value) => value.reject());
			this.rejects = [];
			this.resolves = [];
		}
	}

	// noinspection JSUnusedGlobalSymbols
	public resolvePrompt(authority: string, audience: TAudience, accessToken: string): void {
		const key = pk(authority, audience);
		this.resolves.filter((value) => value.key === key).forEach((value) => value.resolve(accessToken));
		this.rejects = this.rejects.filter((value) => value.key !== key);
		this.resolves = this.resolves.filter((value) => value.key !== key);
	}

	public async refreshToken(refreshToken: string | null, audience: TAudience): Promise<string | null> {
		if (!refreshToken) return null;

		// If there's an ongoing request for this refresh_token and audience, return its promise.
		if (Object.hasOwn(this.refreshPromises.hasOwnProperty, refreshToken)) {
			return this.refreshPromises[refreshToken];
		}

		const refreshTokenInternal: () => Promise<string | null> = async () => {
			const configuration = this.configurations[audience];
			const document = await this.configProvider.get(configuration.authority, configuration.metadataUri);

			// Prepare the request body
			const body = new FormData();
			body.append("client_id", configuration.clientId);
			body.append("scope", configuration.scope);
			body.append("refresh_token", refreshToken);
			body.append("grant_type", "refresh_token");

			// Make the request
			const key = pk(configuration.authority, audience);
			try {
				const response = await fetch(document.tokenEndpoint, { method: "POST", body: body });
				if (!response.ok) {
					console.info(`OIDC '${key}': refresh_token request failed`, await response.text());
					return null;
				}

				const oidcMessage = new OIDCMessage(await response.json());
				window.localStorage.setItem(key, JSON.stringify(oidcMessage));
				return oidcMessage.accessToken;
			} catch (e) {
				console.info(`OIDC '${key}': refresh_token request failed`, e);
				return null;
			} finally {
				// Request is complete, remove its promise from the cache.
				delete this.refreshPromises[key];
			}
		};

		// Otherwise, start a new request and store its promise.
		const promise = refreshTokenInternal();
		this.refreshPromises[refreshToken] = promise;
		return await promise;
	}

	/** TODOC */
	private async signInIFrame(audience: TAudience): Promise<void> {
		const configuration = this.configurations[audience];
		const key = pk(configuration.authority, audience);

		// Check if a matching promise is already in the queue
		const matchingPromiseEntry = this.iFramePromises.find((entry) => entry.key === key);

		if (matchingPromiseEntry) {
			// If a promise for the same key exists, wait for it to resolve and then exit early
			await matchingPromiseEntry.promise;
			return;
		}

		const uri = await this.buildAuthorizeUri(audience);
		const iframe = document.createElement("iframe");
		uri.searchParams.append("prompt", "none");
		iframe.src = uri.toString();

		const promise = new Promise<void>((resolve, reject) => {
			function handleMessage(e: MessageEvent) {
				if (e.data === "success") {
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

		this.iFramePromises.push({ key, promise });

		// Execute promises in the queue one at a time
		if (this.currentIFramePromise === null) {
			let earlyExit = false;

			while (this.iFramePromises.length > 0) {
				const { promise, key: currentKey } = this.iFramePromises.shift()!;
				this.currentIFramePromise = promise;

				try {
					await this.currentIFramePromise;
					// Check for early exit condition after promise resolution
					if (currentKey === key) {
						earlyExit = true;
					}
				} finally {
					this.currentIFramePromise = null;
				}

				if (earlyExit) {
					break;
				}
			}
		} else {
			await this.currentIFramePromise;
		}
	}

	public async signInUserInteraction(audience: TAudience): Promise<never> {
		const uri = await this.buildAuthorizeUri(audience);
		window.location.href = uri.toString();
		return await indefinitePromise<never>(); // Suspend the promise until this window is gone due to redirect
	}

	/** TODOC */
	public async signInCallback(): Promise<void> {
		let key: string = "[NOT SET]";
		try {
			const searchParams = new URLSearchParams(window.location.search);
			const err = searchParams.get("error");
			if (err) {
				// noinspection ExceptionCaughtLocallyJS
				throw new OIDCError(err);
			}

			const code = searchParams.get("code") ?? "";
			const state = searchParams.get("state") ?? "";

			const payloadJson = window.sessionStorage.getItem(state);
			if (!payloadJson) {
				// noinspection ExceptionCaughtLocallyJS
				throw new OIDCError("State not found in storage");
			}
			const statePayload = JSON.parse(payloadJson) as OIDCStatePayload<TAudience>;
			window.sessionStorage.removeItem(state);

			const config = this.configurations[statePayload.audience];
			key = pk(config.authority, statePayload.audience);

			const document = await this.configProvider.get(config.authority, config.metadataUri);

			const formData = new FormData();
			formData.append("client_id", config.clientId);
			formData.append("scope", config.scope);
			formData.append("redirect_uri", config.redirectUri);
			formData.append("code", code);
			formData.append("code_verifier", statePayload.codeVerifier);
			formData.append("grant_type", "authorization_code");

			const response = await fetch(document.tokenEndpoint, { method: "POST", body: formData });
			if (!response.ok) {
				// noinspection ExceptionCaughtLocallyJS
				throw new OIDCError(`authorization_code request failed: ${await response.text()}`);
			}

			const oidcMessage = new OIDCMessage(await response.json());
			if (!oidcMessage.isNonceValid(statePayload.nonce)) {
				// noinspection ExceptionCaughtLocallyJS
				throw new Error("Nonce has changed. Token might have been tampered with. Failing.");
			}

			window.localStorage.setItem(key, JSON.stringify(oidcMessage));

			if (window !== window.parent) {
				window.parent.postMessage("success");
			}
		} catch (e) {
			const oidcError = new OIDCError();
			if (e instanceof Error) {
				oidcError.message = e.message;
				oidcError.name = e.name;
				oidcError.stack = e.stack;
				oidcError.cause = e.cause;
			}
			if (window !== window.parent) {
				window.parent.postMessage({ type: "error", details: oidcError }, "*");
			} else {
				console.info(`OIDC '${key}': callback failed`, e);
			}
		}
	}

	public promptSignIn(audience: TAudience): void {
		this.configurations[audience].onSignInPrompt?.(audience);
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

	private async buildAuthorizeUri(audience: TAudience): Promise<URL> {
		const configuration = this.configurations[audience];
		const document = await this.configProvider.get(configuration.authority, configuration.metadataUri);
		const url = new URL(document.authorizationEndpoint);

		const buffer = new Uint8Array(32);
		window.crypto.getRandomValues(buffer);
		const codeVerifier = this.base64URLEncode(buffer);

		const state = btoa(window.crypto.randomUUID());
		const statePayload: OIDCStatePayload<TAudience> = { audience, codeVerifier, nonce: window.crypto.randomUUID() };
		window.sessionStorage.setItem(state, JSON.stringify(statePayload));

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
}

class OIDCError extends Error {}
