import type { Fetch } from "$lib/http/Fetch.js";
import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
import type { DateOnly, DateWrap } from "$lib/date/DateOnly.js";
import { RESTHttp } from "$lib/http/RESTHttp.js";
import { User } from "$sandbox/models/User.js";
import { goto } from "$app/navigation";

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

	/** TODOC */
	private optimistic = true;

	/** TODOC */
	public async getUser(id: number, signal: AbortSignal): Promise<User> {
		return await this.get("test").withQuery({ id: id.toString() }).fromJSONObject(User, signal);
	}

	/** TODOC */
	public createUserStore() {
		const store = this.saga<User, { update: (id: number, form: FormData) => Promise<number>; delete: (id: number) => Promise<void> }>()
			.withMutator("update", async (signal, id, form) => {
				let newId: number;
				if (this.optimistic) {
					const rollback = store.update(User, form);
					try {
						newId = await this.post("test").withQuery({ id: id.toString() }).withBody(form).fromNumber(signal);
					} catch (e) {
						rollback();
						throw e;
					}
					await store.updateAndInvokeGetter((signal) => this.getUser(newId, signal));
				} else {
					newId = await this.post("test").withQuery({ id: id.toString() }).withBody(form).fromNumber(signal);
					await store.updateAndInvokeGetter((signal) => this.getUser(newId, signal));
				}
				await goto(`/http/${newId}`, { replaceState: true });
				return newId;
			})
			.toSvelteStore();

		return store;
	}
}

/** @see TestHTTP */
export const testHttp = new TestHTTP();

/** TODOC */
export const testUserStore = testHttp.createUserStore();
