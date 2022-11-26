import {writableAsync} from "../store/async/WritableAsync";
import {WeatherForecast} from "./WeatherForecast";

/** @internal */
async function getForecasts() {
	const res = await fetch("http://localhost:5000/WeatherForecast");
	if (!res.ok) {
		throw new Error("Not success");
	}
	const json = await res.json();
	if (!Array.isArray(json)) {
		throw new Error("Not array");
	}
	return json.map((el) => new WeatherForecast(el));
}

/** @internal */
export const forecasts = writableAsync<WeatherForecast[]>(getForecasts);
