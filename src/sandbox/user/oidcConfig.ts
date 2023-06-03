import type { OIDCConfigurations } from "$lib/oidc/protocol.js";
import { OIDCManager } from "$lib/oidc/OIDCManager.js";
import { browserWritable } from "$lib/store/index.js";

export const signInPrompt = browserWritable<"MS.Graph" | null>(null);

/** */
export const oidcConfigs: OIDCConfigurations<"MS.Graph"> = {
	onSignInPrompt: (key) => signInPrompt.set(key),
	"MS.Graph": {
		metadataAddress: "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
		clientId: "1d17ed29-60b6-4c19-9c57-bdf5ce27f3ce",
		redirectUri: "http://localhost:5173/signin-oidc",
		scopeSets: ["openid profile email User.Read"]
	}
};

export const oidcManager = new OIDCManager(oidcConfigs);
