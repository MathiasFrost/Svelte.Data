import type { PageLoad } from "./$types.js";
import { testHttp } from "$sandbox/http/TestHTTP";

/** @inheritdoc */
export const load = (async ({ fetch }) => {
	const forecasts = testHttp.getForecasts(fetch);
	return { forecasts };
}) satisfies PageLoad;
