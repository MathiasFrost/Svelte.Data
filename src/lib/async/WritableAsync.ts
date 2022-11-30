import {writable, type StartStopNotifier, type Writable} from "svelte/store";
import type {AsyncState} from "./AsyncState";

/** */
export type WritableAsync<T> = Writable<AsyncState<T>> & {
	/** Call `promise` again
	 * @param silent Default `false`. Set to `true` if you don't want to revert store value to placeholder before fetching */
	refresh(silent?: boolean): Promise<void>;
};

/** Optional parameters */
export type WritableAsyncOptions<T> = {
	/** Optional placeholder value to use instead of undefined (pending) */
	placeholder?: T;

	/** Start and stop notifications for subscriptions */
	start?: StartStopNotifier<T>;

	/** browserOnly Set to true if we should <b>not</b> fetch on the server */
	browserOnly?: boolean;
};

/** @internal */
export function __writableAsync<T>(promise: () => Promise<T>, options?: WritableAsyncOptions<T>, store?: Writable<T>): WritableAsync<T> {
	const {subscribe, set, update} = store ?? writable<AsyncState<T>>(options?.placeholder, options?.start);

	async function refresh(silent?: boolean): Promise<void> {
		try {
			if (!silent) {
				set(options?.placeholder);
			}
			const state = await promise();
			set(state);
		} catch (e) {
			console.error(e);
			set(e as Error);
		}
	}

	if (!options?.browserOnly || typeof window !== "undefined") refresh(true).then(); // Initially, store is already set to placeholder

	return {
		subscribe,
		set,
		update,
		refresh
	};
}

/** Create a `WritableAsync` store that fetches data asynchronously, i.e. from an API, using fetch.
 * @param promise Function returning a promise for the data
 * @param options Optional parameters */
export function writableAsync<T>(promise: () => Promise<T>, options?: WritableAsyncOptions<T>): WritableAsync<T> {
	return __writableAsync(promise, options);
}
