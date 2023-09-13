import { ensureDateString, ensureNumber, ensureObject, ensureStringNullable } from "$lib/types/unknown.js";

/** @internal */
export class WeatherForecast {
	date: Date;
	temperatureC: number;
	temperatureF: number;
	summary: string | null;

	public constructor(something: unknown) {
		const o = ensureObject(something);
		this.date = ensureDateString(o.date, true);
		this.temperatureC = ensureNumber(o.temperatureC);
		this.temperatureF = ensureNumber(o.temperatureF);
		this.summary = ensureStringNullable(o.summary);
	}
}
