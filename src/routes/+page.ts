//import { ensureArray } from "$lib";
//import { WeatherForecast } from "$sandbox/models/WeatherForecast";

import type { WeatherForecast } from "$sandbox/models/WeatherForecast";

/** @type {import('./$types').PageLoad} */
export async function load() {
	//const res = await fetch("http://localhost:5000/WeatherForecast");
	const item: WeatherForecast[] = []; //ensureArray(await res.json()).map((something) => new WeatherForecast(something));

	return { item };
}
