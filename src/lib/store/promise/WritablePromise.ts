import type {MaybePromise} from "$app/forms";
import {writable, type StartStopNotifier, type Writable} from "svelte/store";

/** */
export type WritablePromise = {
	/** Reset store value back to original promise
	 * @param silent Default `false`. Set to `true` if you want to instead await the promise and update store to it's value */
	reset(silent?: boolean): Promise<void>;
};

/** Optional parameters */
export type WritablePromiseOptions<T> = {
	/** Start and stop notifications for subscriptions */
	start?: StartStopNotifier<T>;

	/** browserOnly Set to true if we should <b>not</b> fetch on the server */
	browserOnly?: boolean;
};

/** @internal */
export function __writablePromise<T>(
	value: () => Promise<T>,
	options?: WritablePromiseOptions<T>,
	store?: Writable<T>
): WritablePromise & Writable<MaybePromise<T>> {
	let promise: () => Promise<T>;
	if (options?.browserOnly && typeof window === "undefined") {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const emptyPromise = () => new Promise<T>(() => {});
		promise = emptyPromise;
	} else {
		promise = value;
	}

	const {subscribe, set, update} = store ?? writable<MaybePromise<T>>(promise(), options?.start);

	async function reset(silent?: boolean): Promise<void> {
		set(silent ? await value() : value());
	}

	return {
		subscribe,
		set,
		update,
		reset
	};
}

/** Create a `WritableAsync` store that fetches data asynchronously, i.e. from an API, using fetch.
 * @param value The promise
 * @param options Optional parameters */
export function writablePromise<T>(value: () => Promise<T>, options?: WritablePromiseOptions<T>): WritablePromise & Writable<MaybePromise<T>> {
	return __writablePromise(value, options);
}
