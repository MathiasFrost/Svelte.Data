import type { Preprocess } from "$lib/http/Preprocess.js";
import type { Postprocess } from "$lib/http/Postprocess.js";
import type { Fetch } from "$lib/http/Fetch.js";

/** Options for @see HTTPClient */
export interface HTTPClientOptions {
	/** @see RequestInit */
	defaultRequestInit?: RequestInit;

	/** @see Preprocess */
	preprocess?: Preprocess;

	/** @see Postprocess */
	postprocess?: Postprocess;

	/** How many times we should retry the requests if they result in status codes 500, 502, 503, 504, 507, 429, 425, 408 */
	retries?: number;

	/** Custom underlying fetch function to use instead of the default `window.fetch` */
	fetch?: Fetch;
}
