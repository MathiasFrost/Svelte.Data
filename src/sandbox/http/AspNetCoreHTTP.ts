import { oidcManager } from "$sandbox/user/oidcConfig.js";
import { ensureObject } from "$lib/types/index.js";

export class AspNetCoreHTTP {
	private static httpClient = oidcManager.createHttpClient("http://localhost:5000/OAuth2/", "AspNetCore.API");

	public static async getClaims(): Promise<Record<string, unknown>> {
		return await this.httpClient.get("Claims").fromJSONObject(ensureObject);
	}
}
