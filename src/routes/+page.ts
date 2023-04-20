import { HTTPClient, ensureArray } from "$lib";
import { TestClient } from "$sandbox/http/TestClient";
import { WeatherForecast } from "$sandbox/models/WeatherForecast";

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	HTTPClient.setFetch(fetch);
	//const forecasts = ensureArray(await (await fetch("http://localhost:5000/WeatherForecast")).json()).map((something) => new WeatherForecast(something));
	const forecasts = await TestClient.getServerForecasts(fetch);
	return { forecasts };
}
