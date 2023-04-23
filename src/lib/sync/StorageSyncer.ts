import type { ITransformer } from "$lib/types/ITransformer.js";
import { Syncer } from "./Syncer.js";

/** @internal */
export abstract class StorageSyncer<T> extends Syncer<T> {
	/** */
	protected abstract get storage(): Storage | null;

	/** @inheritdoc */
	public override pull(): T {
		if (this.storage === null) return this.fallback;

		const string = this.storage.getItem(this.key);
		if (string === null) return this.fallback;

		return this.transformer.deserialize(string);
	}

	/** @inheritdoc */
	public override push(something: T): void {
		this.storage?.setItem(this.key, this.transformer.serialize(something));
	}

	/** @inheritdoc */
	public override clear(): void {
		this.storage?.removeItem(this.key);
	}

	/** @inheritdoc */
	protected constructor(key: string, fallback: T, transformer?: ITransformer<T>) {
		super(key, fallback, transformer);
	}
}
