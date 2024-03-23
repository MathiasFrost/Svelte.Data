interface SvelteHTTPOptions extends RequestInit {
	readonly milliseconds: number;
	readonly refreshOnFocus: boolean;
	readonly pauseOnBlur: boolean;
	postprocess: Postprocess;
	preprocess: Preprocess;
	readonly startImmediately: boolean;
	fetch: Fetch;
}

interface SvelteHTTPRequest<T> {
	readonly promise: Promise<T>;
	get value(): T;
	readonly pending: boolean | null;
	readonly error: HTTPResponseError | null;
	readonly hasValue: boolean;
}

interface SvelteHTTPRequestStore<T, TMutations extends Mutations> extends Readable<SvelteHTTPRequest<T>> {
	refresh(silent?: boolean): Promise<T>;
	start(): void;
	mutate<Key extends keyof TMutations>(key: Key): ReturnType<TMutations[Key]>;
	update(mutation: Record<string, unknown> | [string, unknown] | FormData): () => void;
}
