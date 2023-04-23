import type { ITransformer } from "$lib/types/ITransformer.js";
import { StorageSyncer } from "./StorageSyncer.js";

/** */
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
	public constructor(key: string, fallback: T, transformer?: ITransformer<T>) {
		super(key, fallback, transformer);
	}
}
