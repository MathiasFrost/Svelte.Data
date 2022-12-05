import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
import { testClient } from "$sandbox/services/testClient";
import { writableAsyncHistoric } from "$sandbox/example/WritableAsyncHistoric";

export const {
	history: forecastHistory, // Providing histry and index stores as separate objects are more convenient,
	index: forecastIndex, // allowing you to use Svelte's auto-subscribe ('$')
	value: forecasts
} = writableAsyncHistoric<WeatherForecast[]>(testClient.getForecasts.bind(testClient));
