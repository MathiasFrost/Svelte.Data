import {StorageSyncer} from "./StorageSyncer";
import type {SyncerOptions} from "./Syncer";

export class SessionStorageSyncer<T> extends StorageSyncer<T> {
	protected getStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.sessionStorage;
	}
	public constructor(key: string, options?: SyncerOptions<T>) {
		super(key, options);
	}
}
