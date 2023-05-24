import type { Readable, StartStopNotifier, Updater, Writable } from "svelte/store";
import { readonly, writable } from "svelte/store";

/** @see writable
 * `Writable` that ignores `set`/`update` client-side */
export function serverWritable<T>(value?: T, start?: StartStopNotifier<T>): Writable<T> {
	const { set: _set, update: _update, subscribe } = writable<T>(value, start);

	function set(this: void, value: T): void {
		if (typeof window !== "undefined") return;
		_set(value);
	}

	function update(this: void, updater: Updater<T>): void {
		if (typeof window !== "undefined") return;
		_update(updater);
	}

	return { set, update, subscribe };
}

/** @see browserWritable */
export function serverReadable<T>(value?: T, start?: StartStopNotifier<T>): Readable<T> {
	return readonly(serverWritable<T>(value, start));
}
