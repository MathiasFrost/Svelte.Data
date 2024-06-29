import type { Serializer } from "$lib/utils/Serializer.js";
import { Syncer } from "$lib/sync/Syncer.js";

/** @internal */
export abstract class StorageSyncer<T> extends Syncer<T> {
	/** TODOC */
	protected abstract get storage(): Storage | null;

	/** @inheritdoc */
	public override pull(): T {
		if (this.storage === null) return this.fallback;

		const string = this.storage.getItem(this.key);
		if (string === null) return this.fallback;

		return this.deserialize(string);
	}

	/** @inheritdoc */
	public override push(something: T): void {
		this.storage?.setItem(this.key, this.serializer.serialize(something));
	}

	/** @inheritdoc */
	public override clear(): void {
		this.storage?.removeItem(this.key);
	}

	/** @inheritdoc */
	protected constructor(key: string, fallback: T, serializer?: Serializer<T>) {
		super(key, fallback, serializer);
	}
}
