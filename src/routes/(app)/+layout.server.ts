import type { LayoutServerLoad } from "./$types";
import { serverOidcManager } from "$sandbox/user/oidcConfig";

/** TODOC */
export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
	const oidc = serverOidcManager(fetch, cookies);
	await oidc.ensureValidAccessToken("MS.Graph");
	const o = await oidc.getIdTokenObject("MS.Graph");
	return { user: o };
};
