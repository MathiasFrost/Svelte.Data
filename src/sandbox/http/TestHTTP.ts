import type { Fetch } from "$lib/http/Fetch.js";
import { HTTPClient } from "$lib/http/HTTPClient.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
import { indefinitePromise } from "$lib/async/index.js";
import { ensureObject, ensureString } from "$lib/types/index.js";
import type { DateOnly } from "$lib/date/DateOnly.js";
import type { DateWrap } from "$lib/date/DateOnly.js";
import type { Postprocess, Preprocess } from "$lib/http/index.js";
import { oidcManager } from "$sandbox/user/oidcConfig.js";

/** Attach access_token if exists
 * @notes Rather than pre-emptively making sure our access_token is valid, we send the request first, then react to 401 or 403 */
const bearerPreprocess: Preprocess = async (requestInit) => {
	const headers = new Headers({ ...requestInit.headers });
	const accessToken = oidcManager.accessTokens["MS.Graph"];
	if (accessToken) headers.append("Authorization", `Bearer ${accessToken}`);
	requestInit.headers = headers;
};

/** Try to acquire a token once if we get 401 or 403
 * @notes It is recommended to not initialize a request if the user does not have access to the resource. If 401 or 403 happens, we assume the user's token needs to be re-acquired */
const bearerPostprocess: Postprocess = async (response, nullable, retry, retryCount) => {
	if (!nullable && [401, 403].includes(response.status)) {
		if (typeof window !== "undefined") {
			if (retryCount < 1) {
				if (await oidcManager.getAccessToken("MS.Graph")) {
					return await retry();
				} else {
					oidcManager.promptSignIn("MS.Graph");
				}
			}
		}
		await indefinitePromise<never>();
	}
	return null;
};

/** @static */
export class TestHTTP {
	/** TODOC */
	private static client = new HTTPClient("http://localhost:5173/api/", { redirect: "manual" }, bearerPreprocess, bearerPostprocess);

	/** TODOC */
	public static async getForecasts(fetch?: Fetch): Promise<WeatherForecast[]> {
		return await this.client
			.get("weatherforecast")
			.withFetch(fetch)
			.fromJSONArray((something) => new WeatherForecast(something));
	}

	public static async getUser(): Promise<{ name: string } | null> {
		return await this.client.get("user").fromJSONObjectNullable<{ name: string }>((something) => ({ name: ensureString(ensureObject(something).name) }));
	}

	public static async getTest(): Promise<string> {
		return await this.client.get("test").fromString();
	}

	public static async postUseR(): Promise<void> {
		await this.client.post("user").fetch();
	}

	public static async getDateOnly(dateOnly: DateOnly, wrap: DateWrap): Promise<DateOnly> {
		return await this.client.get("http://localhost:5043/WeatherForecast/DateOnly").withQuery({ dateOnly: dateOnly.toJSON() }).fromDateOnlyString(wrap);
	}
}
