import {type Updater, writable, type Writable} from "svelte/store";
import type {StorageInit} from "./StorageInit";

/** localStorage, sessionStorage and cookies */
export interface WritableStorage<T> extends Writable<T> {
	/** Key to store data in storage */
	key: string;

	/** Set store value to the data stored in storage */
	reset: () => void;
}

/** */
export function writableStorage<T>(init: StorageInit<T>, getStorage: () => Storage | null): WritableStorage<T> {
	function getValue(): T {
		try {
			const storage = getStorage();
			const json = storage ? storage.getItem(init.key) : null;
			return json ? (typeof init.transform === "function" ? init.transform(json) : JSON.parse(json)) : init.initialValue;
		} catch (error) {
			console.error(error);
			if (init.initialValue) {
				return init.initialValue;
			}
			throw new Error(`Could not retrieve value from localStorage and no initial value was provided. Key: ${init.key}`);
		}
	}

	function setValue(value: T): void {
		try {
			const storage = getStorage();
			if (!storage) {
				return;
			}
			storage.setItem(init.key, JSON.stringify(value));
		} catch (error) {
			console.error(error);
		}
	}

	const {subscribe, set: _set, update: _update} = writable<T>(getValue(), init.start);

	function set(value: T): void {
		setValue(value);
		_set(value);
	}

	function update(this: void, updater: Updater<T>): void {
		_update((prev) => {
			const value = updater(prev);
			setValue(value);
			return value;
		});
	}

	function reset(): void {
		update(getValue);
	}

	return {
		subscribe,
		set,
		update,
		key: init.key,
		reset
	};
}
