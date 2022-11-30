import {type WritableStorage, writableStorage, type WritableStorageOptions} from "../shared/WritableStorage";

/** Create a `WritableSessionStorage` that syncs with `window.sessionStorage`
 * @param key Key
 * @param options Optional parameters */
export function writableSessionStorage<T>(key: string, options?: WritableStorageOptions<T>): WritableStorage<T> {
	function getLocalStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.sessionStorage;
	}

	return writableStorage<T>(key, getLocalStorage, options);
}
