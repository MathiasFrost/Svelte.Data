import {type WritableStorage, writableStorage, type WritableStorageOptions} from "../shared/WritableStorage";

/** Create a `WritableLocalStorage` that syncs with `window.localStorage`
 * @param key Key
 * @param options Optional parameters */
export function writableLocalStorage<T>(key: string, options?: WritableStorageOptions<T>): WritableStorage<T> {
	function getLocalStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.localStorage;
	}

	return writableStorage<T>(key, getLocalStorage, options);
}
