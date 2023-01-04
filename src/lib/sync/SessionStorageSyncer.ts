import { StorageSyncer } from "./StorageSyncer.js";
import type { SyncerOptions } from "./Syncer.js";

/** Replicate data to `sessionStorage` */
export class SessionStorageSyncer<T> extends StorageSyncer<T> {
	/** @inheritdoc */
	protected get storageName(): string {
		return "sessionStorage";
	}

	/** @internal */
	protected getStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.sessionStorage;
	}

	/** Replicate data to `sessionStorage`
	 * @param key Key for `sessionStorage`
	 * @param options Optional parameters */
	public constructor(key: string, options?: SyncerOptions<T>) {
		super(key, options);
	}
}
