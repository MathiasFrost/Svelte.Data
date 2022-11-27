import {historicWritableAsync} from "$lib/store/async/HistoricWritableAsync";
import {historicWritable} from "$lib/store/shared/HistoricWritable";
import {TestClient} from "./http/TestClient";
import type {WeatherForecast} from "./WeatherForecast";

/** @internal */
const _testClient = new TestClient("http://localhost:5000");

/** @internal */
export const forecasts = historicWritableAsync<WeatherForecast[]>(_testClient.getForecasts.bind(_testClient), {cap: 10, browserOnly: true});

/** @internal */
export const historic = historicWritable<string>("test");
