import type { Serializer } from "$lib/types/Serializer.js";
import { StorageSyncer } from "$lib/sync/StorageSyncer.js";

/** Sync values to `window.localStorage` */
export class SessionStorageSyncer<T> extends StorageSyncer<T> {
	/** @inheritdoc */
	protected override get storage(): Storage | null {
		return typeof window === "undefined" ? null : window.sessionStorage;
	}

	/** @inheritdoc */
	protected override get storageName(): string {
		return "sessionStorage";
	}

	/** @inheritdoc */
	public constructor(key: string, fallback: T, serializer?: Serializer<T>) {
		super(key, fallback, serializer);
	}
}
