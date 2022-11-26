import type {StorageInit} from "../shared/StorageInit";
import {type WritableStorage, writableStorage} from "../shared/WritableStorage";

/** */
export function writableSessionStorage<T>(init: StorageInit<T>): WritableStorage<T> {
	function getLocalStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.sessionStorage;
	}

	return writableStorage<T>(init, getLocalStorage);
}
