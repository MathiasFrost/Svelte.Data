export { AsyncData, type IAsyncDataOptions } from "$lib/async/AsyncData.js";

/** Utility function for a promise that never resolves */
export function indefinitePromise<T>(): Promise<T> {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	return new Promise<T>(() => {});
}
