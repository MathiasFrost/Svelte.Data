import type {WritableAsync} from "$lib/store/async/WritableAsync";
import {get, writable, type StartStopNotifier, type Updater} from "svelte/store";
import {DeepCopy} from "../shared/deepCopy";
import type {HistoricWritable} from "../shared/HistoricWritable";
import type {AsyncState} from "./AsyncState";

export interface HistoricWritableAsync<T> extends HistoricWritable<T>, WritableAsync<T> {}

/** Create a `WritableAsync` store that fetches data asynchronously, i.e. from an API using fetch.
 * @param asyncData Function returning the async data
 * @param cap How many changes to remember
 * @param placeholder Optional placeholder value to use instead of undefined (pending)
 * @param start Start and stop notifications for subscriptions */
export function historicWritableAsync<T>(
	asyncData: () => Promise<T>,
	cap: number,
	placeholder?: T,
	start?: StartStopNotifier<AsyncState<T>>
): HistoricWritableAsync<AsyncState<T>> {
	const {subscribe, set: _set, update: _update} = writable<AsyncState<T>>(placeholder, start);

	const history = writable<AsyncState<T>[]>([]);
	const {subscribe: subscribeHistory, set: _setHistory, update: _updateHistory} = history;

	const index = writable<number>(-1);
	const {subscribe: subscribeIndex, set: _setIndex, update: _updateIndex} = index;

	function undo(): void {
		const histories = get(history);
		const i = get(index);
		if (i > 0) {
			_updateIndex((prev) => --prev);
			_set(histories[i - 1]);
		}
	}

	function redo(): void {
		const histories = get(history);
		const i = get(index);
		if (i < histories.length - 1) {
			_updateIndex((prev) => ++prev);
			_set(histories[i + 1]);
		}
	}

	function deleteHistory(): void {
		_setHistory([]);
		_setIndex(0);
	}

	function addHistory(item: AsyncState<T>): void {
		if (typeof item === "undefined" || item instanceof Error) {
			return;
		}
		_updateHistory((prev) => {
			return [...prev, item];
		});
		console.log(get(history));
		_updateIndex((prev) => ++prev);
	}

	function set(this: void, value: AsyncState<T>): void {
		const copy: AsyncState<T> = Array.isArray(value) ? value.map((i) => ({...i})) : value;
		_set(copy);
		addHistory(copy);
	}

	function update(this: void, updater: Updater<AsyncState<T>>): void {
		_update((prev: AsyncState<T>) => {
			const value = updater(prev);
			const copy: AsyncState<T> = Array.isArray(value) ? value.map((i) => ({...i})) : value;
			addHistory(copy);
			return copy;
		});
	}
	async function refresh(silent?: boolean): Promise<void> {
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

	if (typeof window !== "undefined") refresh().then();

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
