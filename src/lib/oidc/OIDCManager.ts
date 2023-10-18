import type { OIDCConfigurations } from "$lib/oidc/OIDCConfiguration.js";
import { indefinitePromise } from "$lib/async/index.js";
import type { Fetch } from "$lib/http/index.js";
import { OIDCConfigurationProvider } from "$lib/oidc/OIDCConfigurationProvider.js";
import { OIDCMessage } from "$lib/oidc/OIDCMessage.js";
import { createRetryFetch } from "$lib/http/createRetryFetch.js";

/** @notes order matters */
enum AcquisitionMethod {
	/** Get OIDC object from `window.localStorage` */
	Storage,

	/** Get OIDC object by exchanging a refresh_token */
	RefreshToken,

	/** Get OIDC object by signing in through iframe and SSO */
	IFrame,

	/** Get OIDC object by signing in through standard redirection */
	UserInteraction
}

/** Errors thrown inside `signInCallback` */
class OIDCError extends Error {}

/** @returns Key to use for audience when interacting with `window.localStorage` */
function storagePrefix(audience: string): string {
	return `OIDC_${audience}`;
}

/** Object to store in `window.sessionStorage` before redirecting to OIDC authorization endpoint */
interface OIDCStatePayload<TAudience extends string> {
	/** The OIDC code_verifier generated */
	readonly codeVerifier: string;

	/** The audience in question */
	readonly audience: TAudience;

	/** The OIDC nonce generated */
	readonly nonce: string;
}

/** Class to manage all OIDC objects for multiple audiences */
export class OIDCManager<TAudience extends string> {
	/** @see OIDCConfigurations */
	public configurations: OIDCConfigurations<TAudience>;

	/** @see OIDCConfigurationProvider */
	private readonly configProvider = new OIDCConfigurationProvider();

	/** Reference to the currently active iframe sign in process */
	private currentIFramePromise: Promise<void> | null = null;

	/** Queue of iframe sign in requests */
	private readonly iFramePromises: { audience: TAudience; promise: Promise<void> }[] = [];

	/** Authorities that has failed iframe sign in */
	private readonly iFrameRejections: string[] = [];

	/** References to active refresh_tokens exchange requests per refresh_token */
	private readonly refreshPromises: { [key: string]: Promise<number | null> } = {};

	/** Store resolves from suspending user interaction sign ins from `getOidcMessage` */
	private resolves: { audience: TAudience; resolve: (expiresIn: number) => void }[] = [];

	/** Store rejects from suspending user interaction sign ins from `getOidcMessage` */
	private rejects: { audience: TAudience; reject: () => void }[] = [];

	/** @param configurations Configuration for all audiences the app will use */
	public constructor(configurations: OIDCConfigurations<TAudience>) {
		this.configurations = configurations;
	}

	public getExpiresIn(audience: TAudience): number | null {
		if (typeof window === "undefined") throw new Error("Can't get expires_in server-side");
		const expiresIn = Number(window.localStorage.getItem(storagePrefix(audience)));
		if (isNaN(expiresIn)) return null;
		return expiresIn;
	}

	public async getAccessToken(audience: TAudience): Promise<string | null> {
		if (typeof window === "undefined") throw new Error("Can't get access_token server-side");
		const configuration = this.configurations[audience];
		const res = await fetch(`${configuration.cookieGetEndpoint}/${storagePrefix(audience)}_AccessToken`, { credentials: "include" });
		if (res.ok) return await res.text();
		return null;
	}

	public async getIdToken(audience: TAudience): Promise<string | null> {
		if (typeof window === "undefined") throw new Error("Can't get access_token server-side");
		const configuration = this.configurations[audience];
		const res = await fetch(`${configuration.cookieGetEndpoint}/${storagePrefix(audience)}_IdToken`, { credentials: "include" });
		if (res.ok) return await res.text();
		return null;
	}

	public async getRefreshToken(audience: TAudience): Promise<string | null> {
		if (typeof window === "undefined") throw new Error("Can't get access_token server-side");
		const configuration = this.configurations[audience];
		const res = await fetch(`${configuration.cookieGetEndpoint}/${storagePrefix(audience)}_RefreshToken`, { credentials: "include" });
		if (res.ok) return await res.text();
		return null;
	}

	/** @returns The deserialized id_token. Empty object if failed. */
	public async getIdTokenObject(audience: TAudience): Promise<Record<string, unknown>> {
		const idToken = await this.getIdToken(audience);
		if (!idToken) return {};
		try {
			return JSON.parse(this.decodeJwt(idToken));
		} catch (e) {
			console.warn("Unable to deserialize id_token ", e);
			return {};
		}
	}

	public isNotExpired(expiresIn: number | null): expiresIn is number {
		if (!expiresIn) return false;
		const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
		const tokenExpiresAt = currentTime + expiresIn;
		return currentTime < tokenExpiresAt;
	}

	/** Custom fetch that manages attaching access_token to requests.
	 * @see HTTPClient
	 * @see HTTPClientOptions
	 * @param audience OIDC audience matching the resource this fetch should communicate with
	 * @param maxRetries How many times we should retry the requests if they result in status codes 500, 502, 503, 504, 507, 429, 425, 408 */
	public createFetch(audience: TAudience, maxRetries: number = 0): Fetch {
		const retryFetch = createRetryFetch(maxRetries);
		return async (requestInfo, requestInit, nullStatusCodes) => {
			if (typeof window === "undefined") throw new Error("OIDC Fetcher can't be used server-side");

			await this.ensureValidAccessToken(audience);

			let response = await retryFetch(requestInfo, requestInit);

			// Check if status code is of a value that we want to accept as null and hence not retry

			// First check if we have to retry based on 401 or 403
			if (!nullStatusCodes?.includes(response.status) && [401, 403].includes(response.status)) {
				const expiresIn = await this.ensureValidAccessToken(audience, true);
				if (!this.isNotExpired(expiresIn)) {
					console.info(`OIDC '${audience}': req-acquired access_token but none acquired. Giving up.`);
					return response;
				}
				response = await retryFetch(requestInfo, requestInit);
			}
			return response;
		};
	}

	/** @returns The OIDC object for the specified audience
	 * @param audience The audience to get OIDC object for
	 * @param forceRefresh Set to true if we skip trying to fetch from storage and initiate the process of acquiring a new token */
	public async ensureValidAccessToken(audience: TAudience, forceRefresh: boolean = false): Promise<number> {
		if (typeof window === "undefined") throw new Error("Can't call getAccessToken server-side");

		const config = this.configurations[audience];
		let method: AcquisitionMethod = forceRefresh ? AcquisitionMethod.RefreshToken : AcquisitionMethod.Storage;

		// Try all methods from storage retrieval to refresh_token exchange through iframe silent sign-in to user interaction redirect
		while (method <= AcquisitionMethod.UserInteraction) {
			// If window is not active we suspend this promise and resume when visible again to avoid fetching logic to happen twice
			if (document.hidden) {
				console.info(`OIDC '${audience}': asked for access_token on inactive window. Suspending until active again`);
				const promise = new Promise<void>((resolve) => {
					function listener(): void {
						if (!document.hidden) {
							console.info(`OIDC '${audience}': window active. Resuming.`);
							resolve();
							document.removeEventListener("visibilitychange", listener);
						}
					}

					document.addEventListener("visibilitychange", listener);
				});
				await promise;
			}

			switch (method) {
				case AcquisitionMethod.Storage:
					{
						const expiresIn = this.getExpiresIn(audience);
						const refreshToken = await this.getRefreshToken(audience);
						// If we have valid token, all is good
						if (this.isNotExpired(expiresIn)) {
							console.info(`OIDC '${audience}': access_token found in storage and valid. Returning.`);
							return expiresIn;
						} else if (refreshToken) {
							console.info(`OIDC '${audience}': access_token found but invalid. Initiating refresh_token exchange.`);
							method = AcquisitionMethod.RefreshToken;
						} else {
							console.info(`OIDC '${audience}': access_token invalid and refresh_token not found. Initiating iframe sign in.`);
							method = AcquisitionMethod.IFrame;
						}
					}
					break;
				case AcquisitionMethod.RefreshToken:
					{
						const refreshToken = await this.getRefreshToken(audience);
						const refreshTokenResult = await this.refreshToken(refreshToken, audience);
						if (refreshTokenResult) {
							console.info(`OIDC '${audience}': refresh_token exchange successful. Returning new access_token.`);
							return refreshTokenResult;
						} else {
							console.info(`OIDC '${audience}': refresh_token exchange failed. Proceeding to iframe.`);
							method = AcquisitionMethod.IFrame;
						}
					}
					break;
				case AcquisitionMethod.IFrame:
					{
						await this.signInIFrame(audience); // This method stores OIDC result in storage if successful
						const expiresIn = this.getExpiresIn(audience);
						if (this.isNotExpired(expiresIn)) {
							console.info(`OIDC '${audience}': iframe sign-in successful. Returning new access_token.`);
							return expiresIn;
						} else {
							console.info(`OIDC '${audience}': iframe sign-in failed. Proceeding to user interaction.`);
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
						const promise = new Promise<number>((resolve, reject) => {
							this.resolves.push({ audience, resolve });
							this.rejects.push({ audience, reject });
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

	/** Call to reject the sign in prompt from `getOidcMessage` when user interaction is required */
	// noinspection JSUnusedGlobalSymbols
	public rejectPrompt(audience?: TAudience): void {
		if (audience) {
			this.rejects.filter((value) => value.audience === audience).forEach((value) => value.reject());
			this.rejects = this.rejects.filter((value) => value.audience !== audience);
			this.resolves = this.resolves.filter((value) => value.audience !== audience);
		} else {
			this.rejects.forEach((value) => value.reject());
			this.rejects = [];
			this.resolves = [];
		}
	}

	/** Call to resolve the sign in prompt from `getOidcMessage` when user interaction is required
	 * @notes Probably shouldn't use */
	// noinspection JSUnusedGlobalSymbols
	public resolvePrompt(audience: TAudience, expiresIn: number): void {
		this.resolves.filter((value) => value.audience === audience).forEach((value) => value.resolve(expiresIn));
		this.rejects = this.rejects.filter((value) => value.audience !== audience);
		this.resolves = this.resolves.filter((value) => value.audience !== audience);
	}

	/** Exchange a refresh_token for a new OIDC object */
	public async refreshToken(refreshToken: string | null, audience: TAudience): Promise<number | null> {
		if (!refreshToken) return null;

		// If there's an ongoing request for this refresh_token and audience, return its promise.
		if (Object.hasOwn(this.refreshPromises.hasOwnProperty, refreshToken)) {
			return this.refreshPromises[refreshToken];
		}

		const refreshTokenInternal: () => Promise<number | null> = async () => {
			const configuration = this.configurations[audience];
			const document = await this.configProvider.get(configuration.authority, configuration.metadataUri);

			// Prepare the request body
			const body = new FormData();
			body.append("client_id", configuration.clientId);
			body.append("scope", configuration.scope);
			body.append("refresh_token", refreshToken);
			body.append("grant_type", "refresh_token");

			// Make the request
			try {
				const response = await fetch(document.tokenEndpoint, { method: "POST", body: body });
				if (!response.ok) {
					console.info(`OIDC '${audience}': refresh_token request failed`, await response.text());
					return null;
				}

				const oidcMessage = new OIDCMessage(await response.json());
				await this.setOidc(audience, oidcMessage);
				return oidcMessage.expiresIn;
			} catch (e) {
				console.info(`OIDC '${audience}': refresh_token request failed`, e);
				return null;
			} finally {
				// Request is complete, remove its promise from the cache.
				delete this.refreshPromises[audience];
			}
		};

		// Otherwise, start a new request and store its promise.
		const promise = refreshTokenInternal();
		this.refreshPromises[refreshToken] = promise;
		return await promise;
	}

	/** Redirect to OIDC provider's authorization endpoint */
	public async signInUserInteraction(audience: TAudience): Promise<never> {
		const uri = await this.buildAuthorizeUri(audience);
		window.location.href = uri.toString();
		return await indefinitePromise<never>(); // Suspend the promise until this window is gone due to redirect
	}

	/** Handle the return from an OIDC authorization endpoint
	 * @notes Should be called `onMount` on the page resolved to the redirect_uri specified in configuration */
	public async signInCallback(): Promise<void> {
		let audience: string = "[NOT SET]";
		try {
			const searchParams = new URLSearchParams(window.location.search);
			const err = searchParams.get("error");
			if (err) {
				// noinspection ExceptionCaughtLocallyJS
				throw new OIDCError(`${err}: ${searchParams.get("error_description")}`);
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
			audience = statePayload.audience;

			const config = this.configurations[statePayload.audience];
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

			await this.setOidc(audience as TAudience, oidcMessage);

			if (window !== window.parent) {
				window.parent.postMessage("success", "*");
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
				console.info(`OIDC '${audience}': callback failed`, e);
			}
		}
	}

	/** Call the function `onSignInPrompt` supplied in configuration
	 * @see OIDCConfiguration */
	public promptSignIn(audience: TAudience): void {
		this.configurations[audience].onSignInPrompt?.(audience);
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

	/** Sign in via iframe.
	 * @notes For this to be successful the user needs a valid SSO session with the OIDC provider. */
	private async signInIFrame(audience: TAudience): Promise<void> {
		// Check if a matching promise is already in the queue
		const matchingPromiseEntry = this.iFramePromises.find((entry) => entry.audience === audience);
		if (matchingPromiseEntry) {
			// If a promise for the same key exists, wait for it to resolve and then exit early
			await matchingPromiseEntry.promise;
			return;
		}

		const signInIFrameInternal: () => Promise<void> = async () => {
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

			try {
				await promise;
			} catch (e) {
				this.iFrameRejections.push(this.configurations[audience].authority);
				console.info(`OIDC '${audience}': sign-in iframe failed`, e);
			}
		};

		// Execute promises in the queue one at a time
		if (this.currentIFramePromise === null) {
			let earlyExit = false;

			while (this.iFramePromises.length > 0) {
				const current = this.iFramePromises.shift()!;
				this.currentIFramePromise = current.promise;

				try {
					await this.currentIFramePromise;
					// Check for early exit condition after promise resolution
					if (current.audience === audience) {
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

		// If an authority has rejected us once there is no point in trying again before user interaction, at which point this array is reset
		const config = this.configurations[audience];
		if (this.iFrameRejections.includes(config.authority)) {
			console.info(`OIDC '${audience}': sign-in for ${config.authority} has already failed. Not trying again.`);
			return;
		}

		const promise = signInIFrameInternal();
		this.iFramePromises.push({ audience, promise });
		await promise;
	}

	/** Set the OIDC object in `window.localStorage` */
	private async setOidc(audience: TAudience, oidcMessage: OIDCMessage): Promise<void> {
		if (typeof window === "undefined") return;
		const configuration = this.configurations[audience];
		if (oidcMessage.accessToken)
			await fetch(`${configuration.cookieSetEndpoint}/${storagePrefix(audience)}_AccessToken?jwtBearer=${oidcMessage.accessToken}`, {
				credentials: "include"
			});

		if (oidcMessage.idToken)
			await fetch(`${configuration.cookieSetEndpoint}/${storagePrefix(audience)}_IdToken?jwtBearer=${oidcMessage.idToken}`, { credentials: "include" });

		if (oidcMessage.refreshToken)
			await fetch(`${configuration.cookieSetEndpoint}/${storagePrefix(audience)}_RefreshToken?jwtBearer=${oidcMessage.refreshToken}`, {
				credentials: "include"
			});

		if (oidcMessage.expiresIn) window.localStorage.setItem(storagePrefix(audience), oidcMessage.expiresIn.toString());
	}

	/** @returns Encoded bytes as base64 to be used in URL */
	private base64URLEncode(bytes: Uint8Array): string {
		return btoa(String.fromCharCode.apply(null, Array.from(bytes)))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	}

	/** @returns A byte array of a SHA-256 digested string */
	private async sha256(input: string): Promise<number[]> {
		// Convert the string to a buffer
		const msgBuffer = new TextEncoder().encode(input);
		// Hash the buffer
		const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
		// Convert ArrayBuffer to Array
		return Array.from(new Uint8Array(hashBuffer));
	}

	/** @returns The fully qualified URI for the OIDC provider's authorization endpoint
	 * @notes Will store values that need to be accessed in callback in `window.sessionStorage` */
	private async buildAuthorizeUri(audience: TAudience): Promise<URL> {
		const configuration = this.configurations[audience];
		const document = await this.configProvider.get(configuration.authority, configuration.metadataUri);
		const url = new URL(document.authorizationEndpoint);

		const buffer = new Uint8Array(32);
		window.crypto.getRandomValues(buffer);
		const codeVerifier = this.base64URLEncode(buffer);

		const state = btoa(window.crypto.randomUUID());
		const nonce = window.crypto.randomUUID();
		const statePayload: OIDCStatePayload<TAudience> = { audience, codeVerifier, nonce };
		window.sessionStorage.setItem(state, JSON.stringify(statePayload));

		const codeChallenge = this.base64URLEncode(new Uint8Array(await this.sha256(codeVerifier)));

		// Gather all scopes for the same authority, so we can ask for consent for all scopes up-front
		const scopes: string[] = [];
		for (const audience of Object.keys(this.configurations)) {
			const config = this.configurations[audience as TAudience];
			if (config.authority === configuration.authority) scopes.push(config.scope);
		}

		url.searchParams.append("client_id", configuration.clientId);
		url.searchParams.append("scope", scopes.join(" "));
		url.searchParams.append("redirect_uri", configuration.redirectUri);
		url.searchParams.append("state", state);
		url.searchParams.append("nonce", nonce);
		url.searchParams.append("code_challenge", codeChallenge);
		url.searchParams.append("code_challenge_method", "S256");
		url.searchParams.append("response_mode", "query");
		url.searchParams.append("response_type", "code");

		return url;
	}
}
