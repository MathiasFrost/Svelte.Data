import { StorageSyncer } from "./StorageSyncer.js";
import type { ISyncerOptions } from "./Syncer.js";

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
	public constructor(key: string, options?: ISyncerOptions<T>) {
		super(key, options);
	}
}
