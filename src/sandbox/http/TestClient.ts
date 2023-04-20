import { ensureArray } from "$lib";
import { HTTPClient } from "$lib/http/HTTPClient";
import { WeatherForecast } from "$sandbox/models/WeatherForecast";

/** @static */
export class TestClient {
	/** */
	private static client = new HTTPClient("http://localhost:5000/", HTTPClient.backendInit());

	/** */
	public static async getForecasts(): Promise<WeatherForecast[]> {
		console.log("invoked");
		return await this.client.get("WeatherForecast").fromJSONArray((something) => new WeatherForecast(something));
	}

	/** */
	public static async getServerForecasts(fetch: typeof window.fetch): Promise<WeatherForecast[]> {
		console.log("invoked");
		return ensureArray(await (await fetch("http://localhost:5000/WeatherForecast")).json()).map((something) => new WeatherForecast(something));
	}

	/** */
	public static async getTest(): Promise<string | null> {
		return await this.client.get("WeatherForecast/Test").withNullStatus(404).fromStringNullable();
	}
}
