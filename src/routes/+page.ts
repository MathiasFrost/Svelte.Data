import { HTTPClient } from "$lib";
import { TestClient } from "$sandbox/http/TestClient";

/** @type {import('./$types').PageServerLoad } */
export async function load({ fetch }) {
	HTTPClient.setFetch(fetch);
	//const forecasts = ensureArray(await (await fetch("http://localhost:5000/WeatherForecast")).json()).map((something) => new WeatherForecast(something));
	const forecasts = TestClient.getServerForecasts(fetch);
	return { forecasts };
}
