import type { ITransformer } from "$lib/types/ITransformer.js";
import { StorageSyncer } from "./StorageSyncer.js";

/** */
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
	public constructor(key: string, fallback: T, transformer?: ITransformer<T>) {
		super(key, fallback, transformer);
	}
}
