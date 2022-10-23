import { writable, type Writable } from 'svelte/store';
import type { AsyncState } from './AsyncState';

/** @inheritDoc */
export interface WritableAsync<T> extends Writable<T> {
	/** @param silent Default false. Set to true if you don't want to set store to pending before refetching */
	reFetch(silent?: boolean): Promise<void>;
}

/** @param asyncData Function returning the async data
 * @param placeholder Optional placeholder value to use instead of undefined (pending) */
export function writableAsync<T>(
	asyncData: () => Promise<T>,
	placeholder?: T
): WritableAsync<AsyncState<T>> {
	const { subscribe, set, update } = writable<AsyncState<T>>(placeholder);

	async function reFetch(silent?: boolean): Promise<void> {
		try {
			if (silent !== true) {
				set(placeholder);
			}
			const state = await asyncData();
			set(state);
		} catch (error) {
			console.error(error);
			set(error as Error);
		}
	}

	reFetch();

	return {
		subscribe,
		set,
		update,
		reFetch
	};
}
