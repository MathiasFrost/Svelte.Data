import {__writableAsync, type WritableAsync, type WritableAsyncOptions} from "$lib/store/async/WritableAsync";
import {writable, type Writable} from "svelte/store";
import {__historicWritable, type HistoricWritable, type HistoricWritableOptions} from "../shared/HistoricWritable";
import {stateIsResolved, type AsyncState} from "./AsyncState";

/** */
export type HistoricWritableAsync<T> = HistoricWritable<T> & WritableAsync;

/** Optional parameters */
type HistoricWritableAsyncOptions<T> = HistoricWritableOptions<T> & WritableAsyncOptions<T>;

/** @internal */
export function __historicWritableAsync<T>(
	asyncData: () => Promise<T>,
	options?: HistoricWritableAsyncOptions<T>,
	store?: Writable<T>
): HistoricWritableAsync<T> & Writable<AsyncState<T>> {
	store ??= writable<T>(options?.placeholder, options?.start);

	options ??= {};
	const copy = typeof options.condition === "function" ? options.condition.bind({}) : () => true;
	options.condition = (value: AsyncState<T>) => {
		return stateIsResolved(value) && copy(value);
	};

	const {subscribe, set, update, history, index, redo, undo, deleteHistory, addHistory} = __historicWritable<T>(options?.placeholder, options, store);
	const {refresh} = __writableAsync<AsyncState<T>>(asyncData, options, {subscribe, set, update});

	return {
		subscribe,
		set,
		update,
		refresh,
		history,
		index,
		undo,
		redo,
		deleteHistory,
		addHistory
	};
}

/** Create a `HistoricWritableAsync` store that fetches data asynchronously, i.e. from an API, using fetch.
 * In addition to keeping track of changes made through `set` and `update`
 * @param asyncData Function returning a promise for the data
 * @param options Optional parameters */
export function historicWritableAsync<T>(
	asyncData: () => Promise<T>,
	options?: HistoricWritableAsyncOptions<T>
): HistoricWritableAsync<T> & Writable<AsyncState<T>> {
	return __historicWritableAsync(asyncData, options);
}
