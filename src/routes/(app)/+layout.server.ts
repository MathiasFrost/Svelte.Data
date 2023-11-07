import type { LayoutServerLoad } from "./$types";
import { serverOidcManager } from "$sandbox/user/oidcConfig";
import { TabManager } from "$lib/oidc";

/** TODOC */
export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	TabManager.setTab(true, cookies);
	const oidc = serverOidcManager(fetch, cookies);
	const signInPrompt = (await oidc.ensureValidAccessToken("MS.Graph")) === 0;
	const user = signInPrompt ? {} : await oidc.getIdTokenObject("MS.Graph");
	return { user, signInPrompt: signInPrompt ? "MS.Graph" : null };
};
