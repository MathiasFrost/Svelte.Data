import type { OIDCConfigurations } from "$lib/oidc/OIDCConfiguration.js";
import { indefinitePromise } from "$lib/async/index.js";
import type { Fetch } from "$lib/http/index.js";
import { OIDCMessage } from "$lib/oidc/OIDCMessage.js";
import { OIDCConfigurationProvider } from "$lib/oidc/OIDCConfigurationProvider.js";

/** @notes order matters */
enum AcquisitionMethod {
	Storage,

	RefreshToken,

	IFrame,

	UserInteraction
}

class OIDCError extends Error {}

function storagePrefix(audience: string) {
	return `OIDC_${audience}`;
}

interface OIDCStatePayload<TAudience extends string> {
	readonly codeVerifier: string;
	readonly audience: TAudience;
	readonly nonce: string;
}

export class OIDCManager<TAudience extends string> {
	public configurations: OIDCConfigurations<TAudience>;
	private readonly configProvider = new OIDCConfigurationProvider();
	private currentIFramePromise: Promise<void> | null = null;
	private readonly iFramePromises: { audience: TAudience; promise: Promise<void> }[] = [];
	private readonly iFrameRejections: string[] = [];
	private readonly refreshPromises: { [key: string]: Promise<OIDCMessage | null> } = {};

	public constructor(configurations: OIDCConfigurations<TAudience>) {
		this.configurations = configurations;
	}

	public createFetch(audience: TAudience, retries: number = 0): Fetch {
		return async (requestInfo, requestInit, nullStatusCodes) => {
			if (typeof window === "undefined") throw new Error("OIDC Fetcher can't be used server-side");

			requestInit ??= {};
			let headers = new Headers({ ...requestInit.headers });

			let oidcMessage = await this.getOidcMessage(audience);
			if (oidcMessage.accessToken) headers.append("Authorization", `Bearer ${oidcMessage.accessToken}`);
			requestInit.headers = headers;

			let response = await window.fetch(requestInfo, requestInit);

			// Check if status code is of a value that we want to accept as null and hence not retry

			// First check if we have to retry based on 401 or 403
			if (!nullStatusCodes?.includes(response.status) && [401, 403].includes(response.status)) {
				headers = new Headers({ ...requestInit.headers });
				oidcMessage = await this.getOidcMessage(audience, true);
				if (!oidcMessage.accessToken) {
					console.info(`OIDC '${audience}': req-acquired access_token but none acquired. Giving up.`);
					return response;
				}
				headers.append("Authorization", `Bearer ${oidcMessage.accessToken}`);
				requestInit.headers = headers;
				response = await window.fetch(requestInfo, requestInit);
			}

			// Then check if we want general retries for 500, 502, 503, 504, 507, 429, 425, 408
			let retryCount = 0;
			while (!nullStatusCodes?.includes(response.status) && [500, 502, 503, 504, 507, 429, 425, 408].includes(response.status) && retryCount < retries) {
				retryCount++;
				await new Promise((resolve) => setTimeout(resolve, 1_000));
				response = await window.fetch(requestInfo, requestInit);
			}
			return response;
		};
	}

	public async getOidcMessage(audience: TAudience, forceRefresh: boolean = false): Promise<OIDCMessage> {
		if (typeof window === "undefined") throw new Error("Can't call getAccessToken server-side");

		const config = this.configurations[audience];
		let method: AcquisitionMethod = forceRefresh ? AcquisitionMethod.RefreshToken : AcquisitionMethod.Storage;

		// Try all methods from storage retrieval to refresh_token exchange through iframe silent sign-in to user interaction redirect
		while (method <= AcquisitionMethod.UserInteraction) {
			switch (method) {
				case AcquisitionMethod.Storage:
					{
						const oidcMessage = this.getOidc(audience);
						// If we have valid token, all is good
						if (oidcMessage.hasValidAccessToken) {
							console.info(`OIDC '${audience}': access_token found in storage and valid. Returning.`);
							return oidcMessage;
						} else if (oidcMessage.refreshToken) {
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
						const oidcMessage = this.getOidc(audience);
						const refreshTokenResult = await this.refreshToken(oidcMessage.refreshToken, audience);
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
						const oidcMessage = this.getOidc(audience);
						if (oidcMessage.accessToken) {
							console.info(`OIDC '${audience}': iframe sign-in successful. Returning new access_token.`);
							return oidcMessage;
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
						const promise = new Promise<OIDCMessage>((resolve, reject) => {
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

	private resolves: { audience: TAudience; resolve: (oidc: OIDCMessage) => void }[] = [];
	private rejects: { audience: TAudience; reject: () => void }[] = [];

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

	// noinspection JSUnusedGlobalSymbols
	public resolvePrompt(audience: TAudience, oidc: OIDCMessage): void {
		this.resolves.filter((value) => value.audience === audience).forEach((value) => value.resolve(oidc));
		this.rejects = this.rejects.filter((value) => value.audience !== audience);
		this.resolves = this.resolves.filter((value) => value.audience !== audience);
	}

	public async refreshToken(refreshToken: string | null, audience: TAudience): Promise<OIDCMessage | null> {
		if (!refreshToken) return null;

		// If there's an ongoing request for this refresh_token and audience, return its promise.
		if (Object.hasOwn(this.refreshPromises.hasOwnProperty, refreshToken)) {
			return this.refreshPromises[refreshToken];
		}

		const refreshTokenInternal: () => Promise<OIDCMessage | null> = async () => {
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
				this.setOidc(audience, oidcMessage);
				return oidcMessage;
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

	/** TODOC */
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

	public async signInUserInteraction(audience: TAudience): Promise<never> {
		const uri = await this.buildAuthorizeUri(audience);
		window.location.href = uri.toString();
		return await indefinitePromise<never>(); // Suspend the promise until this window is gone due to redirect
	}

	/** TODOC */
	public async signInCallback(): Promise<void> {
		let audience: string = "[NOT SET]";
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

			this.setOidc(audience as TAudience, oidcMessage);

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

	public promptSignIn(audience: TAudience): void {
		this.configurations[audience].onSignInPrompt?.(audience);
	}

	public getOidc(audience: TAudience): OIDCMessage {
		return new OIDCMessage(typeof window === "undefined" ? null : window.localStorage.getItem(storagePrefix(audience)));
	}

	private setOidc(audience: TAudience, oidcMessage: OIDCMessage): void {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(storagePrefix(audience), JSON.stringify(oidcMessage));
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
