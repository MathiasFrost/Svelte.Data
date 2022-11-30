import {writablePromise} from "$lib/promise/WritablePromise";
import type {WeatherForecast} from "../models/WeatherForecast";
import {testClient} from "../services/testClient";

export const promise = writablePromise<WeatherForecast[]>(testClient.getForecasts.bind(testClient));
