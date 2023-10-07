import type { Preprocess } from "$lib/http/Preprocess.js";
import type { Postprocess } from "$lib/http/Postprocess.js";
import type { Fetch } from "$lib/http/Fetch.js";

/** TODOC */
export interface HTTPClientOptions {
	/** TODOC */
	defaultRequestInit?: RequestInit;

	/** TODOC */
	preprocess?: Preprocess;

	/** TODOC */
	postprocess?: Postprocess;

	/** TODOC */
	retries?: number;

	/** TODOC */
	fetch?: Fetch;
}
