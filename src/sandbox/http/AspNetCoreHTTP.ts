import { oidcManager } from "$sandbox/user/oidcConfig.js";
import { HTTPClient } from "$lib/http/HTTPClient.js";

export class AspNetCoreHTTP {
	private static httpClient = new HTTPClient("http://localhost:5000/OAuth2/", {
		defaultRequestInit: { redirect: "manual", credentials: "include" },
		fetch: oidcManager.createFetch("AspNetCore.API", 3)
	});

	public static async getClaims(): Promise<Record<string, unknown> | null> {
		return await this.httpClient.get("Claims").acceptNullFrom(401, 403).fromJSONObject();
	}

	public static async postValidation(): Promise<void> {
		await this.httpClient.post("Validation").asJSON({ Test: 2 }).fetch();
	}
}
