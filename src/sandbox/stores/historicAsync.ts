import {historicWritableAsync} from "$lib/async/HistoricWritableAsync";
import type {WeatherForecast} from "../models/WeatherForecast";
import {testClient} from "../services/testClient";

/** @internal */
export const historicAsync = historicWritableAsync<WeatherForecast[]>(testClient.getForecasts.bind(testClient), {cap: 10, browserOnly: true});
