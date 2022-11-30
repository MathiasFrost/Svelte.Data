import {writable, type Updater, type Writable} from "svelte/store";
import type {WritableStorageOptions} from "../shared/WritableStorage";

/** */
export type WritableCookie<T> = Writable<T> & {
	/** Name of cookie */
	name: string;

	/** Set store value to the data stored in cookie */
	reset(): void;
};

/** Optional parameters */
export type WritableCookieOptions<T> = WritableStorageOptions<T> & {
	/** Domain to set on cookie */
	domain?: string;

	/** Expire time to set on cookie. Leave empty for session cookies */
	expires?: Date;

	/** Set cookie to HostOnly */
	hostOnly?: boolean;

	/** Set cookie to HttpOnly */
	httpOnly?: boolean;

	/** Set cookie to HttpOnly */
	path?: string;

	/** Cookie SameSite policy. Default = 'None' */
	sameSite?: "Lax" | "Strict" | "None";

	/** Set cookie to secure. Default true */
	secure?: boolean;
};

/** @internal */
export function __writableCookie<T>(name: string, options?: WritableCookieOptions<T>, store?: Writable<T>): WritableCookie<T> {
	function getValue(): T {
		try {
			const cookies = typeof document === "undefined" ? null : document.cookie;
			if (!cookies) {
				return options?.initialValue as T;
			}
			const value = document.cookie
				.split("; ")
				.find((row) => row.startsWith(`${name}=`))
				?.split("=")[1];

			if (typeof value === "undefined") throw new Error("Could not find value");

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
			options ??= {};
			options.secure ??= true;
			options.sameSite ??= "None";

			const cookieComponents: string[] = [`${encodeURI(JSON.stringify(value))}`, `SameSite=${options.sameSite}`];
			if (options.secure) cookieComponents.push("Secure");
			if (options.expires) cookieComponents.push(`Expires=${options.expires.toUTCString()}`);
			if (options.hostOnly) cookieComponents.push("HostOnly");
			if (options.httpOnly) cookieComponents.push("HttpOnly");
			if (options.path) cookieComponents.push(`Path=${options.path}`);

			document.cookie = `${name}=${cookieComponents.join("; ")}`;
		} catch (error) {
			console.error(error);
		}
	}

	const {subscribe, set: _set, update: _update} = store ?? writable<T>(getValue(), options?.start);

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

/** */
export function writableCookie<T>(name: string, options?: WritableCookieOptions<T>): WritableCookie<T> {
	return __writableCookie(name, options);
}
