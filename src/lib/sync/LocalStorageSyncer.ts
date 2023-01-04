import { StorageSyncer } from "./StorageSyncer.js";
import type { SyncerOptions } from "./Syncer.js";

/** Replicate data to `localStorage` */
export class LocalStorageSyncer<T> extends StorageSyncer<T> {
	/** @inheritdoc */
	protected get storageName(): string {
		return "localStorage";
	}

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
