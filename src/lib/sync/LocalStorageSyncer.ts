import type { Transformer } from "$lib/types/Transformer.js";
import { StorageSyncer } from "./StorageSyncer.js";

/** Sync values to `window.localStorage` */
export class LocalStorageSyncer<T> extends StorageSyncer<T> {
	/** @inheritdoc */
	protected override get storage(): Storage | null {
		return typeof window === "undefined" ? null : window.localStorage;
	}

	/** @inheritdoc */
	protected override get storageName(): string {
		return "localStorage";
	}

	/** @inheritdoc */
	public constructor(key: string, fallback: T, transformer?: Transformer<T>) {
		super(key, fallback, transformer);
	}
}
