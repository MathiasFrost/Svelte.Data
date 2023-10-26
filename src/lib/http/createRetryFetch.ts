import type { Fetch } from "$lib/http/Fetch.js";

export function createRetryFetch(maxRetries: number, fetch?: Fetch): Fetch {
	return async (requestInfo, requestInit, nullStatusCodes) => {
		fetch ??= window.fetch;

		// Perform the first fetch without delay
		let response = await fetch(requestInfo, requestInit);

		let retryCount = 0;
		while (!nullStatusCodes?.includes(response.status) && [500, 502, 503, 504, 507, 429, 425, 408].includes(response.status) && retryCount++ < maxRetries) {
			// Calculate exponential backoff with jitter
			const delay = (Math.pow(2, retryCount) + Math.random() * 0.5) * 1_000;

			await new Promise((resolve) => setTimeout(resolve, delay));
			response = await fetch(requestInfo, requestInit);
		}
		return response;
	};
}
