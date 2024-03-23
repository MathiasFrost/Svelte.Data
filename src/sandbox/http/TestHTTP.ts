import type { Fetch } from "$lib/http/Fetch.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
import type { DateOnly, DateWrap } from "$lib/date/DateOnly.js";
import { RESTHttp } from "$lib/http/RESTHttp.js";
import type { User } from "$sandbox/models/User.js";

/** @static */
export class TestHTTP extends RESTHttp {
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

	public createUserStore() {
		return this.saga<User, { update: (id: number, form: FormData) => Promise<number>; delete: (id: number) => Promise<void> }>()
			.withGetter((factory) => factory.get("test").fromJSONObject(User))
			.withMutator("update", async (factory, store, id, form) => {
				let newId: number;
				if (optimistic) {
					const rollback = store.update(form);
					try {
						newId = await factory.post("update").withParams(id).withBody(form).fromNumber();
					} catch (e) {
						rollback();
						throw e;
					}
					store.updateGetter((factory) => factory.get("test").withParams(newId).fromJSONObject(User));
				} else {
					newId = await factory.post("update").withParams(id).withBody(form).fromNumber();
					store.updateAndInvokeGetter((factory) => factory.get("test").withParams(newId).fromJSONObject(User));
				}
				return newId;
			})
			.toSvelteStore();
	}
}

/** @see TestHTTP */
export const testHttp = new TestHTTP();
