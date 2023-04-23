import type { ITransformer } from "$lib/types/ITransformer.js";
import { anyTransformer } from "$lib/types/transformers.js";

export interface ISyncer<T> {
	pull(): T;
	push(value: T): void;
	clear(): void;
}

/** Base class for replicating data */
export abstract class Syncer<T> implements ISyncer<T> {
	/** Functions to convert value to and from it's string representation */
	public transformer: ITransformer<T>;

	/** */
	protected key: string;

	/** Used when we are inevitably unable to retrieve value from replication source */
	public fallback: T;

	/** Type of storage, i.e.: sessionStorage. Used for logging */
	protected abstract get storageName(): string;

	/** Get value from replication source.
	 *
	 * Will return fallback value when unable */
	public abstract pull(): T;

	/** Store value in replication sourc */
	public abstract push(value: T): void;

	/** */
	public abstract clear(): void;

	/** */
	protected constructor(key: string, fallback: T, transformer: ITransformer<T> = anyTransformer()) {
		this.key = key;
		this.fallback = fallback;
		this.transformer = transformer;
	}

	/** Deconstruct the syncer class into just the syncing methods. Useful for combining with Svelte stores */
	public deconstruct(): ISyncer<T> {
		return {
			push: (something: T) => this.push(something),
			pull: () => this.pull(),
			clear: () => this.clear()
		};
	}
}
