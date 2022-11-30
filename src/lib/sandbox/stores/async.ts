import {writableAsync} from "$lib/store/async/WritableAsync";
import type {WeatherForecast} from "../models/WeatherForecast";
import {testClient} from "../services/testClient";

export const async = writableAsync<WeatherForecast[]>(testClient.getForecasts.bind(testClient), {browserOnly: true});
