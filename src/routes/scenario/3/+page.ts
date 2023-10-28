import { TestHTTP } from "$sandbox/http/TestHTTP.js";
import type { PageLoad } from "./$types.js";
import { createRetryFetch } from "$lib/http";

/** @inheritdoc */
export const load = (async ({ fetch }) => {
	const testHttp = new TestHTTP(createRetryFetch(3, fetch));
	const forecasts = testHttp.getForecasts(fetch);
	return { forecasts };
}) satisfies PageLoad;
