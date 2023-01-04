/** Optional parameters */
export type SyncerOptions<T> = {
	/** Value to return in `get` method when server rendering */
	serverValue?: T;

	/** Function to convert replicated string into value */
	deserializer?: (str: string) => T;

	/** Function to convert value into string for replication */
	serializer?: (value: T) => string;

	/** Will set replication source value to this. If not set, value will not be replicated until `sync` is called */
	initialValue?: T;
};

/** Base class for replicating data */
export abstract class Syncer<T> {
	/** Value to return in `get` method when on server */
	public serverValue?: T;

	/** Function to convert replicated string into value */
	public deserializer?: (str: string) => T;

	/** Function to convert value into string for replication */
	public serializer?: (value: T) => string;

	/** Create a new instance
	 * @param options Optional parameters */
	protected constructor(options?: SyncerOptions<T>) {
		this.serverValue = options?.serverValue;
		this.serializer = options?.serializer;
		this.deserializer = options?.deserializer;
	}

	/** */
	protected abstract get storageKey(): string;

	/** */
	protected abstract get storageName(): string;

	/** Try to get value from replication source */
	public abstract tryGet(): T | undefined;

	/** Get value from replication source.
	 *
	 * Will use serverValue when called on the server and throw error if unable to fetch value and no fallback is provided.
	 * @param fallback Return this when value could not be retrieved from replication source */
	public get(fallback?: T): T {
		if (typeof window === "undefined") {
			if (typeof this.serverValue !== "undefined") return this.serverValue;
			else throw new Error(`Tried to fetch value of '${this.storageKey}' from ${this.storageName} on server, but serverValue was not set`);
		}

		let res: T | undefined;
		try {
			res = this.tryGet();
		} catch (e) {
			console.error(e);
		}

		if (typeof res === "undefined") {
			if (typeof fallback === "undefined")
				throw new Error(`Tried to fetch value of '${this.storageKey}' from ${this.storageName}, but no value was found and no fallback was provided`);
			else return fallback;
		}
		return res;
	}

	/** Store value in replication source */
	public abstract sync(value: T): boolean;
}
