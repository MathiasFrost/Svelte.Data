import type { Fetch } from "$lib/http/Fetch.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
import type { DateOnly, DateWrap } from "$lib/date/DateOnly.js";
import { HTTPClient } from "$lib/http/HTTPClient.js";

/** @static */
export class TestHTTP {
	/** TODOC */
	private readonly httpClient: HTTPClient;

	/** ctor */
	public constructor() {
		this.httpClient = new HTTPClient("http://localhost:5173/api/", {
			defaultRequestInit: { redirect: "manual" }
		});
	}

	/** TODOC */
	public async getForecasts(fetch?: Fetch): Promise<WeatherForecast[]> {
		return await this.httpClient
			.get("weatherforecast")
			.withFetch(fetch)
			.fromJSONArray((something) => new WeatherForecast(something));
	}

	public async getTest(): Promise<string> {
		return await this.httpClient.get("test").withFetch(window.fetch).fromString();
	}

	public async getPhoto(): Promise<string> {
		return await this.httpClient.get("https://graph.microsoft.com/v1.0/me/photo/$value").createObjectURL();
	}

	public async postUser(): Promise<void> {
		await this.httpClient.post("user").accept(400, 200).fetch();
	}

	public async getDateOnly(dateOnly: DateOnly, wrap: DateWrap): Promise<DateOnly> {
		return await this.httpClient.get("http://localhost:5043/WeatherForecast/DateOnly").withQuery({ dateOnly: dateOnly.toJSON() }).fromDateOnlyString(wrap);
	}
}

/** @see TestHTTP */
export const testHttp = new TestHTTP();
