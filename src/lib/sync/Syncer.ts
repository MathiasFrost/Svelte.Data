import type { Transformer } from "$lib/types/Transformer.js";
import { jsonTransformer } from "$lib/types/transformers.js";

/** Base class for replicating data */
export abstract class Syncer<T> {
	/** Functions to convert value to and from its string representation */
	public transformer: Transformer<T>;
	/** Used when we are inevitably unable to retrieve value from replication source */
	public fallback: T;
	/** */
	protected key: string;

	/** */
	protected constructor(key: string, fallback: T, transformer: Transformer<T> = jsonTransformer<T>()) {
		this.key = key;
		this.fallback = fallback;
		this.transformer = transformer;
	}

	/** Type of storage, i.e.: sessionStorage. Used for logging */
	protected abstract get storageName(): string;

	/** Get value from replication source.
	 *
	 * Will return fallback value when unable */
	public abstract pull(): T;

	/** Store value in replication source */
	public abstract push(value: T): void;

	/** */
	public abstract clear(): void;

	/** */
	protected deserialize(string: string): T {
		try {
			return this.transformer.deserialize(string);
		} catch (e) {
			console.warn("Unable to deserialize store value properly...\n", e);
			return this.fallback;
		}
	}
}
