/** Utility function for a promise that never resolves */
export function indefinitePromise<T>(): Promise<T> {
	return new Promise<T>(() => {});
}

/** Utility function for ensuring that promise is only called client-side */
export function browserPromise<T>(promiseFactory: () => Promise<T>): Promise<T> {
	if (typeof window === "undefined") return indefinitePromise();
	else return promiseFactory();
}
