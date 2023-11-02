import type { Fetch } from "$lib/http/Fetch.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
import type { DateOnly } from "$lib/date/DateOnly.js";
import type { DateWrap } from "$lib/date/DateOnly.js";
import { oidcManager } from "$sandbox/user/oidcConfig.js";
import { HTTPClient } from "$lib/http/index.js";

/** @static */
export class TestHTTP {
	/** TODOC */
	private readonly httpClient: HTTPClient;

	/** ctor */
	public constructor(fetch: Fetch) {
		this.httpClient = new HTTPClient("http://localhost:5173/api/", {
			defaultRequestInit: { redirect: "manual" },
			fetch
		});
	}

	/** TODOC */
	public async getForecasts(fetch?: Fetch): Promise<WeatherForecast[]> {
		return await this.httpClient.get("weatherforecast").withFetch(fetch).fromJSONArray(WeatherForecast);
	}

	public async getTest(): Promise<string> {
		return await this.httpClient.get("test").withFetch(window.fetch).fromString();
	}

	public async postUser(): Promise<void> {
		await this.httpClient.post("user").accept(400, 200).fetch();
	}

	public async getDateOnly(dateOnly: DateOnly, wrap: DateWrap): Promise<DateOnly> {
		return await this.httpClient.get("http://localhost:5043/WeatherForecast/DateOnly").withQuery({ dateOnly: dateOnly.toJSON() }).fromDateOnlyString(wrap);
	}
}

/** @see TestHTTP */
export const testHttp = new TestHTTP(oidcManager.createFetch("MS.Graph", 3));
