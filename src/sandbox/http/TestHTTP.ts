import type { Fetch } from "$lib/http/Fetch.js";
import { HTTPClient } from "$lib/http/HTTPClient.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";

/** @static */
export class TestHTTP {
	/** */
	private static client = new HTTPClient("http://localhost:5173/api/", HTTPClient.backendInit());

	/** */
	public static async getForecasts(fetch?: Fetch): Promise<WeatherForecast[]> {
		return await this.client
			.get("weatherforecast")
			.withFetch(fetch)
			.fromJSONArray((something) => new WeatherForecast(something));
	}
}
