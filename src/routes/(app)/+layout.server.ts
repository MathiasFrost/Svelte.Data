import type { LayoutServerLoad } from "./$types";
import { serverOidcManager, setSignInPromptStore } from "$sandbox/user/oidcConfig";
import { writable } from "svelte/store";

/** TODOC */
export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	const oidc = serverOidcManager(fetch, cookies);
	await oidc.ensureValidAccessToken("MS.Graph");
	const o = await oidc.getIdTokenObject("MS.Graph");
	setSignInPromptStore(writable());
	return { user: o };
};
