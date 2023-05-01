import type { StartStopNotifier, Updater, Writable } from "svelte/store";
import { writable } from "svelte/store";

/** @see writable
 * `Writable` that ignores `set`/`update` server-side */
export function browserWritable<T>(value?: T, start?: StartStopNotifier<T>): Writable<T> {
	const { set: _set, update: _update, subscribe } = writable<T>(value, start);

	function set(this: void, value: T): void {
		if (typeof window === "undefined") return;
		_set(value);
	}

	function update(this: void, updater: Updater<T>): void {
		if (typeof window === "undefined") return;
		_update(updater);
	}

	return { set, update, subscribe };
}
