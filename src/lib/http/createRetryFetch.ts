import type { Fetch } from "$lib/http/Fetch.js";

/** Status codes that could become successful if retried */
export const TEMPORAL_FAILURES = [502, 503, 504, 507, 429, 425, 408];

/** Create a fetch function that will retry a set amount of times */
export function createRetryFetch(maxRetries: number, fetch?: Fetch): Fetch {
	return async (requestInfo, requestInit) => {
		fetch ??= window.fetch;

		// Perform the first fetch without delay
		let response = await fetch(requestInfo, requestInit);

		let retryCount = 0;
		while (TEMPORAL_FAILURES.includes(response.status) && retryCount++ < maxRetries) {
			// Calculate exponential backoff with jitter
			const delay = (Math.pow(2, retryCount) + Math.random() * 0.5) * 1_000;

			await new Promise((resolve) => setTimeout(resolve, delay));
			response = await fetch(requestInfo, requestInit);
		}
		return response;
	};
}
