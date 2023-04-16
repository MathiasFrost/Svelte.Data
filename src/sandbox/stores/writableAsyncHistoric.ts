import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
import { TestClient } from "$sandbox/http/TestClient";
import { writableAsyncHistoric } from "$sandbox/example/WritableAsyncHistoric";

export const {
	history: forecastHistory, // Providing histry and index stores as separate objects are more convenient,
	index: forecastIndex, // allowing you to use Svelte's auto-subscribe ('$')
	value: forecasts
} = writableAsyncHistoric<WeatherForecast[]>(() => TestClient.getForecasts());
