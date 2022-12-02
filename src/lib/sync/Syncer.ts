export type SyncerOptions<T> = {
	serverValue?: T;
	deserializer?: (str: string) => T;
	serializer?: (value: T) => string;
};

export function stringStorage(serverValue?: string): SyncerOptions<string> {
	return {serverValue, deserializer: (str: string) => str, serializer: (str: string) => str};
}

export abstract class Syncer<T> {
	protected readonly serverValue?: T;

	protected readonly deserializer?: (str: string) => T;

	protected readonly serializer?: (value: T) => string;

	protected constructor(options?: SyncerOptions<T>) {
		this.serverValue = options?.serverValue;
		this.serializer = options?.serializer;
		this.deserializer = options?.deserializer;
	}

	public abstract get(fallback: T): T;
	public abstract get(fallback?: T): T | undefined;

	public abstract sync(value: T): boolean;
}
