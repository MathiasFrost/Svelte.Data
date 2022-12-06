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

/** `SyncerOptions` for plain strings
 * @param serverValue Value to return in `get`method when server rendering */
export function stringSerializer(serverValue?: string): SyncerOptions<string> {
	return { serverValue, deserializer: (str: string) => str, serializer: (str: string) => str };
}

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

	/** Get value from replication source
	 * @param fallback Return this when value could not be retrieved from replication source */
	public abstract get(fallback: T): T;
	public abstract get(fallback?: T): T | undefined;

	/** Store value in replication source */
	public abstract sync(value: T): boolean;
}
