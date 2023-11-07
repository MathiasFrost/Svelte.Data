import type { OIDCConfigurations } from "$lib/oidc/OIDCConfiguration.js";
import { OIDCManager } from "$lib/oidc/OIDCManager.js";
import type { Fetch } from "$lib/http/Fetch.js";
import type { Cookies } from "@sveltejs/kit";
import { getContext, setContext } from "svelte";
import type { Writable } from "svelte/store";

export type Audiences = "MS.Graph" | "AspNetCore.API";

export function setSignInPromptStore(store: Writable<Audiences>): void {
	setContext("signInPrompt", store);
}

export function getSignInPromptStore(): Writable<Audiences> {
	return getContext<Writable<Audiences>>("signInPrompt");
}

const redirectUri = "http://localhost:5173/signin-oidc";
const onSignInPrompt = (audience: Audiences) => getSignInPromptStore().set(audience);
const authority = "https://login.microsoftonline.com/common/v2.0";
const clientId = "1d17ed29-60b6-4c19-9c57-bdf5ce27f3ce";
const cookieSetEndpoint = "/api/oidc";
const cookieGetEndpoint = "/api/oidc";

/** */
export const oidcConfigs: OIDCConfigurations<Audiences> = {
	"MS.Graph": {
		authority,
		clientId,
		redirectUri,
		onSignInPrompt,
		cookieGetEndpoint,
		cookieSetEndpoint,
		scope: "openid profile email User.Read"
	},
	"AspNetCore.API": {
		authority,
		clientId,
		redirectUri,
		onSignInPrompt,
		cookieGetEndpoint,
		cookieSetEndpoint,
		scope: "api://1d17ed29-60b6-4c19-9c57-bdf5ce27f3ce/access_as_user"
	}
};

export const oidcManager = new OIDCManager(oidcConfigs);
export const serverOidcManager = (fetch: Fetch, cookies: Cookies) => new OIDCManager(oidcConfigs, fetch, cookies);
