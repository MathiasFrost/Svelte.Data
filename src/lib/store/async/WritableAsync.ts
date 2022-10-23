import { writable, type Writable } from 'svelte/store';

/** @inheritDoc */
export interface WritableAsync<T> extends Writable<T> {
	/** @param silent Default false. Set to true if you don't want to set store to pending before refetching */
	reFetch(silent?: boolean): Promise<void>;
}

/** Is undefined when pending */
export type AsyncState<T> = undefined | T | Error;

/** @param asyncData Function returning the async data */
export function writableAsync<T>(asyncData: () => Promise<T>): WritableAsync<AsyncState<T>> {
	const { subscribe, set, update } = writable<AsyncState<T>>();

	async function reFetch(silent?: boolean): Promise<void> {
		try {
			if (silent !== true) {
				update(() => undefined);
			}
			const state = await asyncData();
			update(() => state);
		} catch (error) {
			update(() => error as Error);
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
