import {WeatherForecast} from "../WeatherForecast";
import {HttpClientBase} from "./HttpClientBase";

export class TestClient extends HttpClientBase {
	public constructor(baseAddress?: string) {
		super(baseAddress);
	}

	public async getForecasts(): Promise<WeatherForecast[]> {
		const res = await fetch("http://localhost:5000/WeatherForecast");
		return await res.ensureSuccess().getFromJsonArray<WeatherForecast>((el) => new WeatherForecast(el));
	}
}
