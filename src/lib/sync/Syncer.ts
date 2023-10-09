import { type Serializer, jsonSerializer } from "$lib/types/Serializer.js";

/** Base class for replicating data */
export abstract class Syncer<T> {
	/** Functions to convert value to and from its string representation */
	public serializer: Serializer<T>;

	/** Used when we are inevitably unable to retrieve value from replication source */
	public fallback: T;

	/** TODOC */
	protected key: string;

	/** TODOC */
	protected constructor(key: string, fallback: T, serializer: Serializer<T> = jsonSerializer<T>()) {
		this.key = key;
		this.fallback = fallback;
		this.serializer = serializer;
	}

	/** Type of storage, i.e.: sessionStorage. Used for logging */
	protected abstract get storageName(): string;

	/** Get value from replication source.
	 *
	 * Will return fallback value when unable */
	public abstract pull(): T;

	/** Store value in replication source */
	public abstract push(value: T): void;

	/** TODOC */
	public abstract clear(): void;

	/** TODOC */
	protected deserialize(string: string): T {
		try {
			return this.serializer.deserialize(string);
		} catch (e) {
			console.warn("Unable to deserialize store value properly...\n", e);
			return this.fallback;
		}
	}
}
