import {StorageSyncer} from "./StorageSyncer";
import type {SyncerOptions} from "./Syncer";

/** Replicate data to `localStorage` */
export class LocalStorageSyncer<T> extends StorageSyncer<T> {
	/** @internal */
	protected getStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.localStorage;
	}

	/** Replicate data to `localStorage`
	 * @param key Key for `localStorage`
	 * @param options Optional parameters */
	public constructor(key: string, options?: SyncerOptions<T>) {
		super(key, options);
	}
}
