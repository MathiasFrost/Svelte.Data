import type {WritableAsync} from "$lib/store/async/WritableAsync";
import {get, writable, type StartStopNotifier, type Updater} from "svelte/store";
import {deepCopy} from "../shared/DeepCopy";
import type {HistoricWritable} from "../shared/HistoricWritable";
import {isValue, type AsyncState} from "./AsyncState";

export interface HistoricWritableAsync<T> extends HistoricWritable<T>, WritableAsync<T> {}

/** Create a `WritableAsync` store that fetches data asynchronously, i.e. from an API using fetch.
 * @param asyncData Function returning the async data
 * @param cap How many changes to remember
 * @param browserOnly Set to true if we should <b>not</b> fetch on the server
 * @param placeholder Optional placeholder value to use instead of undefined (pending)
 * @param start Start and stop notifications for subscriptions */
export function historicWritableAsync<T>(
	asyncData: () => Promise<T>,
	cap: number,
	browserOnly?: boolean,
	placeholder?: T,
	start?: StartStopNotifier<AsyncState<T>>
): HistoricWritableAsync<AsyncState<T>> {
	const {subscribe, set: _set, update: _update} = writable<AsyncState<T>>(placeholder, start);

	const history = writable<T[]>([]);
	const {subscribe: subscribeHistory, update: _updateHistory} = history;

	const index = writable<number>(-1);
	const {subscribe: subscribeIndex, set: _setIndex, update: _updateIndex} = index;

	function undo(): void {
		const histories = get(history);
		let i = get(index);
		if (i > 0) {
			i--;
			_setIndex(i);
			_set(deepCopy<T>(histories[i]));
		}
	}

	function redo(): void {
		const histories = get(history);
		let i = get(index);
		if (i < histories.length - 1) {
			i++;
			_setIndex(i);
			_set(deepCopy<T>(histories[i]));
		}
	}

	function deleteHistory(): void {
		const i = get(index);
		_updateHistory((prev) => [prev[i]]);
		_setIndex(0);
	}

	function addHistory(value: AsyncState<T>): void {
		if (!isValue(value)) {
			return;
		}
		let i = get(index);
		_updateHistory((prev) => {
			const copy = deepCopy<T>(value);
			if (prev.length >= cap) {
				prev.splice(0, 1);
				i = prev.length - 1;
				_setIndex(i);
			}
			return [...prev.slice(0, i + 1), copy];
		});
		_updateIndex((prev) => ++prev);
	}

	function set(this: void, value: AsyncState<T>): void {
		_set(value);
		addHistory(value);
	}

	function update(this: void, updater: Updater<AsyncState<T>>): void {
		_update((prev: AsyncState<T>) => {
			const value = updater(prev);
			addHistory(value);
			return value;
		});
	}

	async function refresh(silent?: boolean): Promise<void> {
		try {
			if (!silent) {
				_set(placeholder);
			}
			const state = await asyncData();
			set(state);
		} catch (error) {
			console.error(error);
			_set(error as Error);
		}
	}

	if (!browserOnly || typeof window !== "undefined") refresh(true).then(); // Initially, store is already set to placeholder

	return {
		subscribe,
		set,
		update,
		refresh,
		history: {subscribe: subscribeHistory},
		index: {subscribe: subscribeIndex},
		undo,
		redo,
		deleteHistory
	};
}
