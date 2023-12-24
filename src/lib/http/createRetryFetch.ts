import type { Fetch } from "$lib/http/Fetch.js";

/** Status codes that could become successful if retried */
export const TEMPORAL_FAILURES = [502, 503, 504, 507, 429, 425, 408];

/** Create a fetch function that will retry a set amount of times */
export function createRetryFetch(maxRetries: number, fetch?: Fetch): Fetch {
	return async (requestInfo, requestInit) => {
		fetch ??= window.fetch;

		async function tryFetch(): Promise<Response | Error> {
			try {
				return await fetch!(requestInfo, requestInit);
			} catch (e) {
				return e instanceof Error ? e : new Error(`${e}`);
			}
		}

		function isTemporal(response: Response | Error): boolean {
			if (response instanceof Error) {
				// Avoid retrying for CORS errors
				return !response.message.includes("CORS");
			} else {
				// Retry for specified HTTP status codes
				return TEMPORAL_FAILURES.includes(response.status);
			}
		}

		// Perform the first fetch without delay
		let response = await tryFetch();

		let retryCount = 0;
		while (isTemporal(response) && retryCount++ < maxRetries) {
			// Calculate exponential backoff with jitter
			const delay = (Math.pow(2, retryCount) + Math.random() * 0.5) * 1_000;

			await new Promise((resolve) => setTimeout(resolve, delay));
			response = await tryFetch();
		}
		if (response instanceof Error) throw response;
		return response;
	};
}
