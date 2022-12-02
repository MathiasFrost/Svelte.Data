import {WeatherForecast} from "../models/WeatherForecast";
import {HttpClientBase} from "./HttpClientBase";

export class TestClient extends HttpClientBase {
	public constructor(baseAddress?: string) {
		super(baseAddress);
	}

	public async getForecasts(): Promise<WeatherForecast[]> {
		const res = await this.get("WeatherForecast");
		return await res.ensureSuccess().getFromJsonArray<WeatherForecast>((el) => new WeatherForecast(el));
	}
}
