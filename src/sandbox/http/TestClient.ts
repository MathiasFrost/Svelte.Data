import { HTTPClient } from "$lib/http/HTTPClient.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";

/** @static */
export class TestClient {
	/** */
	private static client = new HTTPClient("http://localhost:5173/api/", HTTPClient.backendInit());

	/** */
	public static async getForecasts(fetch?: typeof window.fetch): Promise<WeatherForecast[]> {
		return await this.client
			.get("weatherforecast")
			.withFetch(fetch)
			.fromJSONArray((something) => new WeatherForecast(something));
	}
}
