import { AsyncData, type AsyncState } from "$lib";
import { writable } from "svelte/store";
import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
import { TestClient } from "$sandbox/http/TestClient";

export const forecasts = writable<AsyncState<WeatherForecast[]>>(void 0);
export const forecastData = new AsyncData<WeatherForecast[]>(() => TestClient.getForecasts(), {
	browserOnly: true,
	setValue: (value) => forecasts.set(value)
});
