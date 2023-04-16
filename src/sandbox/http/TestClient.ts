import { HTTPClient } from "$lib/http/HTTPClientTEMP";
import { WeatherForecast } from "$sandbox/models/WeatherForecast";

/** @static */
export class TestClient {
	/** */
	private static client = new HTTPClient("http://localhost:5000/", HTTPClient.backendInit());

	/** */
	public static async getForecasts(): Promise<WeatherForecast[]> {
		return await this.client.get("WeatherForecast").fromJSONArray((something) => new WeatherForecast(something));
	}

	/** */
	public static async getTest(): Promise<string | null> {
		return await this.client.get("WeatherForecast/Test").withNullStatus(404).fromStringNullable();
	}
}
