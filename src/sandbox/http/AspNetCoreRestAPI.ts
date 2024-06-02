import { RestAPI } from "$lib/http/RestAPI.js";

export class AspNetCoreRestAPI {
	private static httpClient = new RestAPI("http://localhost:5000/OAuth2/", {
		defaultRequestInit: { redirect: "manual", credentials: "include" }
	});

	public static async getClaims(): Promise<Record<string, unknown> | null> {
		return await this.httpClient.get("Claims").acceptNullFrom(401, 403).fromJSONObject();
	}

	public static async postValidation(): Promise<void> {
		await this.httpClient.post("Validation").asJSON({ Test: 2 }).fetch();
	}
}
