import {StorageSyncer} from "./StorageSyncer";
import type {SyncerOptions} from "./Syncer";

export class LocalStorageSyncer<T> extends StorageSyncer<T> {
	protected getStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.localStorage;
	}
	public constructor(key: string, options?: SyncerOptions<T>) {
		super(key, options);
	}
}
