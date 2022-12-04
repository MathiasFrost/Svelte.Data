import type { AsyncState } from "$lib";
import { writable, type Readable, type Updater, type Writable } from "svelte/store";
import { AsyncData, stateIsResolved, HistoryManager } from "$lib";

export type WritableAsyncHistoric<T> = Writable<AsyncState<T>> & {
	refresh: (silent?: boolean) => void;
	redo: () => void;
	undo: () => void;
};

export type WritableAsyncHistoricBundle<T> = {
	value: WritableAsyncHistoric<T>;
	index: Readable<number>;
	history: Readable<T[]>;
};

export function writableAsyncHistoric<T>(promise: () => Promise<T>): WritableAsyncHistoricBundle<T> {
	const { set: _set, update: _update, subscribe } = writable<AsyncState<T>>(void 0);

	const index = writable<number>(-1);
	const history = writable<T[]>([]);

	const manager = new HistoryManager<T>({
		cap: 10,
		setValue: (value) => set(value),
		setIndex: (i) => index.set(i),
		setHistory: (value) => history.set(value),
		ensureT(value): value is T {
			return stateIsResolved(value);
		}
	});

	function set(value: AsyncState<T>): void {
		_set(value);
		manager.addEntry(value);
	}

	function update(updater: Updater<AsyncState<T>>): void {
		_update((prev) => {
			if (stateIsResolved(prev)) {
				const val = updater(prev);
				manager.addEntry(val);
				return val;
			}
			return prev;
		});
	}

	const data = new AsyncData<T>(promise, {
		browserOnly: true,
		setValue: (value) => set(value)
	});

	return {
		value: {
			set,
			update,
			subscribe,
			refresh: data.refresh.bind(data),
			redo: manager.redo.bind(manager),
			undo: manager.undo.bind(manager)
		},
		index: { subscribe: index.subscribe },
		history: { subscribe: history.subscribe }
	};
}
