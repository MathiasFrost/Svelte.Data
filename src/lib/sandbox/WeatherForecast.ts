/** @internal */
export class WeatherForecast {
	date: Date;
	temperatureC: number;
	temperatureF: number;
	summary: string | null;

	public constructor(json: any) {
		if (typeof json !== "object" || json == null) {
			throw new Error("Not valid");
		}
		this.date = new Date(json.date);
		this.temperatureC = json.temperatureC;
		this.temperatureF = json.temperatureF;
		this.summary = json.summary;
	}
}
