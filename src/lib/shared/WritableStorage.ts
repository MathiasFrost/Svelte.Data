import {type Updater, writable, type Writable, type StartStopNotifier} from "svelte/store";

/** */
export type WritableStorage<T> = Writable<T> & {
	/** Key to store data in storage */
	key: string;

	/** Set store value to the data stored in storage */
	reset(): void;
};

/** Optional parameters */
export type WritableStorageOptions<T> = {
	/** initialValue Optional initial value */
	initialValue?: T;

	/** transform Optional predicate to transform storage value to desired type. Otherwise, will use JSON.parse with no type assurances */
	transform?: (rawValue: string) => T;

	/** Start and stop notifications for subscriptions */
	start?: StartStopNotifier<T>;
};

/** Create a `WritableStorage` that syncs with `window.sessionStorage`
 * @param key Key
 * @param options Optional parameters */
export function writableStorage<T>(key: string, getStorage: () => Storage | null, options?: WritableStorageOptions<T>): WritableStorage<T> {
	function getValue(): T {
		try {
			const storage = getStorage();
			const str = storage ? storage.getItem(key) : null;
			return str ? (typeof options?.transform === "function" ? options.transform(str) : JSON.parse(str)) : options?.initialValue;
		} catch (error) {
			console.error(error);
			if (options?.initialValue) {
				return options.initialValue;
			}
			throw new Error(`Could not retrieve value from localStorage and no initial value was provided. Key: ${key}`);
		}
	}

	function setValue(value: T): void {
		try {
			const storage = getStorage();
			if (!storage) {
				return;
			}
			storage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error(error);
		}
	}

	const {subscribe, set: _set, update: _update} = writable<T>(getValue(), options?.start);

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
		key,
		reset
	};
}
