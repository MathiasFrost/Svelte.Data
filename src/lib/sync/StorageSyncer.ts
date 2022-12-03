import {Syncer, type SyncerOptions} from "./Syncer";

/** @internal Base class for `localStorage` and `sessionStorage` */
export abstract class StorageSyncer<T> extends Syncer<T> {
	/** Key for `Storage` */
	public readonly key: string;

	/** @internal */
	protected abstract getStorage(): Storage | null;

	/** Create a new instance
	 * @param options Optional parameters */
	public constructor(key: string, options?: SyncerOptions<T>) {
		super(options);
		this.key = key;
	}

	/** Get value from `Storage`
	 * @param fallback Return this when value could not be retrieved from `Storage` */
	public override get(fallback: T): T;
	public override get(fallback?: T): T | undefined {
		try {
			const storage = this.getStorage();
			if (storage) {
				const str = storage.getItem(this.key);
				if (str !== null) {
					return this.deserializer?.(str) ?? JSON.parse(str);
				}
			} else if (typeof this.serverValue !== "undefined") {
				return this.serverValue;
			}
		} catch (e) {
			console.error(e);
		}
		return typeof fallback === "undefined" ? void 0 : fallback;
	}

	/** Store value in `Storage` */
	public override sync(value: T): boolean {
		const storage = this.getStorage();
		if (storage) {
			storage.setItem(this.key, this.serializer?.(value) ?? JSON.stringify(value));
		}
		return false;
	}
}
