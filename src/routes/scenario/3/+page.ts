import { TestClient } from "$sandbox/http/TestClient.js";
import type { PageLoad } from "./$types.js";

/** @inheritdoc */
export const load = (async ({ fetch }) => {
	const forecasts = TestClient.getForecasts(fetch);
	return { forecasts };
}) satisfies PageLoad;
