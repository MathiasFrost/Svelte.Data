import type { Fetch } from "$lib/http/Fetch.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
import type { DateOnly, DateWrap } from "$lib/date/DateOnly.js";
import { RestAPI } from "$lib/http/RestAPI.js";
import { User } from "$sandbox/models/User.js";

/** @static */
export class TestRestAPI extends RestAPI {
	/** ctor */
	public constructor() {
		super("/api/", {
			defaultRequestInit: { redirect: "manual" }
		});
	}

	/** TODOC */
	public async getForecasts(fetch?: Fetch): Promise<WeatherForecast[]> {
		return await this.get("weatherforecast")
			.withFetch(fetch)
			.fromJSONArray((something) => new WeatherForecast(something));
	}

	public async getTest(): Promise<string> {
		return await this.get("test").withFetch(window.fetch).fromString();
	}

	public async getPhoto(): Promise<string> {
		return await this.get("https://graph.microsoft.com/v1.0/me/photo/$value").createObjectURL();
	}

	public async postUser(): Promise<void> {
		await this.post("user").accept(400, 200).fetch();
	}

	public async getDateOnly(dateOnly: DateOnly, wrap: DateWrap): Promise<DateOnly> {
		return await this.get("http://localhost:5043/WeatherForecast/DateOnly").withQuery({ dateOnly: dateOnly.toJSON() }).fromDateOnlyString(wrap);
	}

	/** TODOC */
	public async getUser(id: number, signal: AbortSignal): Promise<User> {
		return await this.get("test").withQuery({ id: id.toString() }).fromJSONObject(User, signal);
	}
}

/** @see TestRestAPI */
export const testHttp = new TestRestAPI();
