import {get, writable, type Readable, type StartStopNotifier, type Updater, type Writable} from "svelte/store";
import {deepCopy} from "./deepCopy";

/** */
export type HistoricWritable<T> = {
	/** Array of historic states */
	history: Readable<T[]>;

	/** Which index of history corresponds to current store value */
	index: Readable<number>;

	/** Revert store value to a previous state */
	undo(): void;

	/** Revert store value to before the last undo */
	redo(): void;

	/** Reset history based on current value */
	deleteHistory(): void;

	/** Manually add a history entry. This is called automatically when invoking `set` or `update` */
	addHistory(value: T): void;
};

/** Optional parameters */
export type HistoricWritableOptions<T> = {
	/** How many changes to remember. If not specified cap is unlimited */
	cap?: number;

	/** Start and stop notifications for subscriptions */
	start?: StartStopNotifier<T>;

	/** Must return true before adding value history */
	condition?: (value: T) => boolean;
};

/** @internal */
export function __historicWritable<T>(value?: T, options?: HistoricWritableOptions<T>, store?: Writable<T>): HistoricWritable<T> & Writable<T> {
	const {subscribe, set: _set, update: _update} = store ?? writable<T>(value, options?.start);

	const history = writable<T[]>([]);
	const {subscribe: subscribeHistory, update: _updateHistory} = history;

	const index = writable<number>(-1);
	const {subscribe: subscribeIndex, set: _setIndex, update: _updateIndex} = index;

	function undo(): void {
		const histories = get(history);
		_updateIndex((prev) => {
			if (prev > 0) {
				prev--;
				_set(deepCopy<T>(histories[prev]));
			}
			return prev;
		});
	}

	function redo(): void {
		const histories = get(history);
		_updateIndex((prev) => {
			if (prev < histories.length - 1) {
				prev++;
				_set(deepCopy<T>(histories[prev]));
			}
			return prev;
		});
	}

	function deleteHistory(): void {
		const i = get(index);
		_updateHistory((prev) => [prev[i]]);
		_setIndex(0);
	}

	function addHistory(value: T): void {
		if (typeof options?.condition === "function" && !options.condition(value)) {
			return;
		}
		let i = get(index);
		_updateHistory((prev) => {
			const copy = deepCopy<T>(value);
			if (typeof options?.cap === "number" && prev.length >= options.cap) {
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
		_update((prev) => {
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
		deleteHistory,
		addHistory
	};
}

/** Create a `HistoricWritable` store that keeps track of changes made through `set` and `update`
 * @param value Initial value
 * @param options Optional parameters */
export function historicWritable<T>(value?: T, options?: HistoricWritableOptions<T>): HistoricWritable<T> & Writable<T> {
	return __historicWritable(value, options);
}
