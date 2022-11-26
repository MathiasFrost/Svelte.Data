import type {UnknownObject} from "$lib/store/shared/UnknownObject";

/** @internal */
export class WeatherForecast {
	date: Date;
	temperatureC: number;
	temperatureF: number;
	summary: string | null;

	public constructor(json: UnknownObject) {
		if (typeof json !== "object" || json == null) throw new Error("Not valid");
		if (typeof json.date !== "string") throw new Error("date was expected to be of type string");
		this.date = new Date(json.date);

		if (typeof json.temperatureC !== "number") throw new Error("temperatureC was expected to be of type number");
		this.temperatureC = json.temperatureC;

		if (typeof json.temperatureF !== "number") throw new Error("temperatureF was expected to be of type number");
		this.temperatureF = json.temperatureF;

		if (typeof json.summary !== "string") throw new Error("summary was expected to be of type string");
		this.summary = json.summary;
	}
}
