import type { Fetch } from "$lib/http/Fetch.js";
import { HTTPClient } from "$lib/http/HTTPClient.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
import { indefinitePromise } from "$lib/async/index.js";
import { ensureObject, ensureString } from "$lib/types/index.js";
import type { DateOnly } from "$lib/date/DateOnly.js";

/** @static */
export class TestHTTP {
	/** TODOC */
	private static client = new HTTPClient("http://localhost:5173/api/", HTTPClient.backendInit(), void 0, async (response, nullable) => {
		if (!nullable && response.status === 401) {
			if (typeof window !== "undefined") {
				window.location.reload();
			}
			await indefinitePromise();
		}
	});

	/** TODOC */
	public static async getForecasts(fetch?: Fetch): Promise<WeatherForecast[]> {
		return await this.client
			.get("weatherforecast")
			.withFetch(fetch)
			.fromJSONArray((something) => new WeatherForecast(something));
	}

	public static async getUser(): Promise<{ name: string } | null> {
		return await this.client
			.get("user")
			.withNullStatus(401)
			.fromJSONObjectNullable<{ name: string }>((something) => ({ name: ensureString(ensureObject(something).name) }));
	}

	public static async getTest(): Promise<string> {
		return await this.client.get("test").fromString();
	}

	public static async postUseR(): Promise<void> {
		await this.client.post("user").fetch();
	}

	public static async getDateOnly(dateOnly: DateOnly): Promise<string> {
		return await this.client.get("http://localhost:5043/WeatherForecast/DateOnly").withQuery({ dateOnly: dateOnly.toJSON() }).fromString();
	}
}
