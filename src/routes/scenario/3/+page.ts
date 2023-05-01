import { TestHTTP } from "$sandbox/http/TestHTTP.js";
import type { PageLoad } from "./$types.js";

/** @inheritdoc */
export const load = (async ({ fetch }) => {
	const forecasts = TestHTTP.getForecasts(fetch);
	return { forecasts };
}) satisfies PageLoad;
