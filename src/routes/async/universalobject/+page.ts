import { HTTPClient } from "$lib";
import { TestClient } from "$sandbox/http/TestClient";
import type { PageLoad } from "./$types";

export const load = (async ({ fetch }) => {
	HTTPClient.setFetch(fetch);
	const forecasts = TestClient.getServerForecasts(fetch);
	return { forecasts };
}) satisfies PageLoad;
