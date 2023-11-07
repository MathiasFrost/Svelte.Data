import { ServerTestHTTP } from "$sandbox/http/TestHTTP.js";
import type { PageLoad } from "./$types.js";

/** @inheritdoc */
export const load = (async ({ fetch }) => {
	const testHttp = new ServerTestHTTP(fetch);
	const forecasts = testHttp.getForecasts(fetch);
	return { forecasts };
}) satisfies PageLoad;
