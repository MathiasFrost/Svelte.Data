import type { OIDCConfigurations } from "$lib/oidc/OIDCConfiguration.js";
import { OIDCManager } from "$lib/oidc/OIDCManager.js";
import { browserWritable } from "$lib/store/index.js";

export type Audiences = "MS.Graph" | "AspNetCore.API";

export const signInPrompt = browserWritable<Audiences | null>(null);

const redirectUri = "http://localhost:5173/signin-oidc";
const onSignInPrompt = (key: Audiences) => signInPrompt.set(key);
const authority = "https://login.microsoftonline.com/common/v2.0";
const clientId = "1d17ed29-60b6-4c19-9c57-bdf5ce27f3ce";

/** */
export const oidcConfigs: OIDCConfigurations<Audiences> = {
	"MS.Graph": {
		authority,
		clientId,
		redirectUri,
		onSignInPrompt,
		scope: "openid profile email User.Read"
	},
	"AspNetCore.API": {
		authority,
		clientId,
		redirectUri,
		onSignInPrompt,
		scope: "api://1d17ed29-60b6-4c19-9c57-bdf5ce27f3ce/access_as_user"
	}
};

export const oidcManager = new OIDCManager(oidcConfigs);
