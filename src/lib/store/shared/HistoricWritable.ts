import {get, writable, type Readable, type StartStopNotifier, type Updater, type Writable} from "svelte/store";
import {deepCopy} from "../shared/DeepCopy";

export interface HistoricWritable<T> extends Writable<T> {
	/** Array of historic states */
	history: Readable<T[]>;

	/** Current index of history. -1 if history is empty array */
	index: Readable<number>;

	/** Revert store to a previous state */
	undo(): void;

	/** Reverse an undo */
	redo(): void;

	/** Delete history */
	deleteHistory(): void;
}

/** Create a `WritableAsync` store that fetches data asynchronously, i.e. from an API using fetch.
 * @param asyncData Function returning the async data
 * @param cap How many changes to remember
 * @param placeholder Optional placeholder value to use instead of undefined (pending)
 * @param start Start and stop notifications for subscriptions */
export function historicWritableAsync<T>(asyncData: () => Promise<T>, cap: number, initialValue?: T, start?: StartStopNotifier<T>): HistoricWritable<T> {
	const {subscribe, set: _set, update: _update} = writable<T>(initialValue, start);

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

	function addHistory(value: T): void {
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

	function set(this: void, value: T): void {
		_set(value);
		addHistory(value);
	}

	function update(this: void, updater: Updater<T>): void {
		_update((prev: T) => {
			const value = updater(prev);
			addHistory(value);
			return value;
		});
	}

	return {
		subscribe,
		set,
		update,
		history: {subscribe: subscribeHistory},
		index: {subscribe: subscribeIndex},
		undo,
		redo,
		deleteHistory
	};
}
