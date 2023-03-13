import {WeatherForecast} from "$sandbox/models/WeatherForecast";
import {HttpClient} from "./HttpClient";

/** @static */
export class TestClient {
    /** */
    private static client = new HttpClient("http://localhost:5000/", "APIClient");

    /** */
    public static async getForecasts(): Promise<WeatherForecast[]> {
        return await this.client.getFromJsonArray("WeatherForecast", something => new WeatherForecast(something));
    }
}
