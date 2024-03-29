/** Utility function for a promise that never resolves */
export function indefinitePromise<T>(): Promise<T> {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	return new Promise<T>(() => {});
}

/** Utility function for ensuring that promise is only called client-side */
export function browserPromise<T>(promiseFactory: () => Promise<T>): Promise<T> {
	if (typeof window === "undefined") return indefinitePromise();
	else return promiseFactory();
}

/** Utility type for an object containing both the value and it's promise representation */
export type ValuePromise<T> = { value: T; promise: Promise<T> };
