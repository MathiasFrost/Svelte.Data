interface SvelteHTTPOptions extends RequestInit {
	readonly milliseconds: number;
	readonly refreshOnFocus: boolean;
	readonly pauseOnBlur: boolean;
	postprocess: Postprocess;
	preprocess: Preprocess;
	readonly startImmediately: boolean;
	fetch: Fetch;
}
