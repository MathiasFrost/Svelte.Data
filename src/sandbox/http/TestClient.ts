import {ensureArray} from "$lib";
import {WeatherForecast} from "$sandbox/models/WeatherForecast";
import {HttpClientBase} from "./HttpClientBase";

export class TestClient extends HttpClientBase {
	public constructor(baseAddress?: string) {
		super(baseAddress);
	}

	public async getForecasts(): Promise<WeatherForecast[]> {
		const res = await this.get("WeatherForecast");
		return ensureArray(await res.ensureSuccess().json()).map((el) => new WeatherForecast(el));
	}
}
