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

	/** Custom underlying fetch function to use instead of the default `window.fetch` */
	fetch?: Fetch;
}
