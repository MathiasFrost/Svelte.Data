import {AsyncData} from "$lib";
import {writable} from "svelte/store";
import type {WeatherForecast} from "$sandbox/models/WeatherForecast";
import {testClient} from "$sandbox/services/testClient";

export const forecasts = writable<undefined | WeatherForecast[] | Error>(void 0);
export const forecastData = new AsyncData<undefined | WeatherForecast[] | Error>(() => testClient.getForecasts(), {
	browserOnly: true,
	setValue: (value) => forecasts.set(value)
});
