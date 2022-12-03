import {AsyncData} from "$lib/async/AsyncData";
import {writable} from "svelte/store";
import type {WeatherForecast} from "../models/WeatherForecast";
import {testClient} from "../services/testClient";

export const forecasts = writable<undefined | WeatherForecast[] | Error>(void 0);
export const forecastData = new AsyncData<undefined | WeatherForecast[] | Error>(() => testClient.getForecasts(), {
	browserOnly: true,
	setValue: (value) => forecasts.set(value)
});
