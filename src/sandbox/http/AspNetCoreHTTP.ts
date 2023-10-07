import { oidcManager } from "$sandbox/user/oidcConfig.js";
import { ensureObject } from "$lib/types/index.js";
import { HTTPClient } from "$lib/http/index.js";

export class AspNetCoreHTTP {
	private static httpClient = new HTTPClient("http://localhost:5000/OAuth2/", {
		defaultRequestInit: { redirect: "manual" },
		fetch: oidcManager.createFetch("AspNetCore.API", 3)
	});

	public static async getClaims(): Promise<Record<string, unknown>> {
		return await this.httpClient.get("Claims").fromJSONObject(ensureObject);
	}
}
