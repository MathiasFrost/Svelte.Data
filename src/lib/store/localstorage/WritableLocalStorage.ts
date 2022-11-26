import type {StorageInit} from "../shared/StorageInit";
import {type WritableStorage, writableStorage} from "../shared/WritableStorage";

/** */
export function writableLocalStorage<T>(init: StorageInit<T>): WritableStorage<T> {
	function getLocalStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.localStorage;
	}

	return writableStorage<T>(init, getLocalStorage);
}
