import {writable, type Updater, type Writable} from "svelte/store";
import type {WritableStorageOptions} from "../shared/WritableStorage";

/** */
export type WritableCookie = {
	/** Name of cookie */
	name: string;

	/** Set store value to the data stored in cookie */
	reset(): void;
};

export function writableCookie<T>(name: string, options?: WritableStorageOptions<T>): WritableCookie & Writable<T> {
	function getValue(): T {
		try {
			const cookies = typeof document === "undefined" ? null : document.cookie;
			if (!cookies) {
				return options?.initialValue as T;
			}
			const start = document.cookie.indexOf(name) + name.length + 1;
			const end = document.cookie.indexOf("; ", start);
			const value = end === -1 ? document.cookie.substring(start) : document.cookie.substring(start, end);
			const str = decodeURI(value);
			return typeof options?.transform === "function" ? options.transform(str) : JSON.parse(str);
		} catch (error) {
			console.error(error);
			if (options?.initialValue) {
				return options.initialValue;
			}
			throw new Error(`Could not retrieve value from cookie and no initial value was provided. Name: ${name}`);
		}
	}

	function setValue(value: T): void {
		if (typeof document === "undefined") {
			return;
		}
		try {
			const start = document.cookie.indexOf(name);
			const end = document.cookie.indexOf("; ", start);
			document.cookie = document.cookie.substring(0, start) + `${name}=${encodeURI(JSON.stringify(value))}` + "; " + document.cookie.substring(end);
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
		name,
		reset
	};
}
