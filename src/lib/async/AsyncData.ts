import type { MaybePromise } from "$app/forms";

/** Optional parameters */
export interface IAsyncDataOptions<T> {
	/** Called when there has been a change to `AsyncState` */
	setter?: (promise: Promise<T>) => void;

	/** Refresh cooldown in milliseconds */
	cooldown?: number;

	/** Refetch interval in milliseconds */
	interval?: number;

	/** This will be called instead of default logic when promise is rejected */
	handleError?: (e: Error) => void;
}

/** Manage async data */
export class AsyncData<T> implements IAsyncDataOptions<T> {
	/** @inheritdoc */
	public setter?: (promsie: Promise<T>) => void;

	/** Promise used to fetch the data */
	public promise: () => Promise<T>;

	/** @inheritdoc */
	public cooldown: number;

	/** When refresh was last called */
	public lastFetched?: Date;

	/** @inheritdoc */
	public interval?: number;

	/** @inheritdoc */
	public handleError?: (e: Error) => void;

	/** */
	private _interval = 0;

	/** Manage async data
	 * @param promise The promise returning the data
	 * @param options Optional parameters */
	public constructor(promise: () => Promise<T>, options?: IAsyncDataOptions<T>) {
		this.promise = promise;
		this.setter = options?.setter;
		this.cooldown = options?.cooldown ?? 0;
		this.interval = options?.interval;
		this.handleError = options?.handleError;
		if (typeof window !== "undefined" && typeof this.interval === "number") {
			this._interval = window.setInterval(() => this.refresh(true), this.interval);
		}
	}

	/** Call to invoke or re-invoke promise
	 * @param silent Set to true if we should not call `setter` with placeholder before invoking promise */
	public async refresh(silent?: boolean): Promise<void> {
		if (typeof window === "undefined") {
			return;
		}
		if (this.cooldown > 0 && this.lastFetched) {
			const diff = new Date().getTime() - this.lastFetched.getTime();
			if (diff < this.cooldown) {
				console.info(`Refresh on cooldown (${this.cooldown - diff}ms)`);
				return;
			}
		}
		const promise = silent ? Promise.resolve(await this.promise()) : this.promise();
		this.setter?.(promise);
		this.lastFetched = new Date();
	}

	/** If `interval` is set, this should preferrably be called `onDestroy` */
	public clearInterval(): void {
		if (typeof window !== "undefined") window.clearInterval(this._interval);
	}
}

/** */
export type AsyncObject<T> = {
	value: MaybePromise<T>;
	refresh: (silent: boolean) => void;
	setPromise: (promise: () => Promise<T>) => void;
};

/** */
export class AsyncBuilder<T> {
	/** */
	private promise?: () => Promise<T>;

	/** */
	private initialValue?: T;

	/** */
	private setter?: (promise: Promise<T>) => void;

	/** The promise */
	public fromPromise(promise: () => Promise<T>): AsyncBuilder<T> {
		this.promise = promise;
		return this;
	}

	/** Adding this will prevent promise from being called immediately.
	 *
	 * Useful for providing a server value if promise uses browser APIs */
	public withInitialValue(value: T): AsyncBuilder<T> {
		this.initialValue = value;
		return this;
	}

	/** Set the value when it changes, like updateing the initial promise from `asObject` */
	public withSetter(setter: (this: void, value: Promise<T>) => void): AsyncBuilder<T> {
		this.setter = setter;
		return this;
	}

	/** */
	public asObject(): AsyncObject<T> {
		const refresh: (silent: boolean) => void = async (silent) => {
			if (typeof this.promise === "undefined") return;
			const value = silent ? Promise.resolve(await this.promise()) : this.promise();
			this.setter?.(value);
		};

		const setPromise: (promise: () => Promise<T>) => void = (promise) => {
			this.promise = promise;
			refresh(true);
		};

		let value: MaybePromise<T>;
		if (typeof this.initialValue !== "undefined") value = this.initialValue;
		else if (typeof this.promise !== "undefined") value = this.promise();
		else throw new Error("Neither promise nor initialValue was set");

		return { value, refresh, setPromise };
	}
}
