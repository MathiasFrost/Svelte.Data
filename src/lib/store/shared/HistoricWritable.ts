import {get, writable, type Readable, type StartStopNotifier, type Updater, type Writable} from "svelte/store";

export interface HistoricWritable<T> extends Writable<T> {
	history: Readable<T[]>;
	index: Readable<number>;
	undo(): void;
	redo(): void;
	deleteHistory(): void;
}

export function historicWritable<T>(initialValue?: T, start?: StartStopNotifier<T>): HistoricWritable<T> {
	const {subscribe, set: _set, update: _update} = writable<T>(initialValue, start);

	let i = 0;
	const history = writable<T[]>([]);
	const {subscribe: subscribeHistory, set: _setHistory, update: _updateHistory} = history;

	function undo(): void {
		_set(get(history)[--i]);
	}

	function redo(): void {
		_set(get(history)[++i]);
	}

	function deleteHistory(): void {
		_setHistory([]);
		i = 0;
	}

	function addHistory(item: T): void {
		_updateHistory((prev) => prev.concat(item));
		i++;
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

	return {subscribe, set, update, history: {subscribe: subscribeHistory}, undo, redo, deleteHistory};
}
