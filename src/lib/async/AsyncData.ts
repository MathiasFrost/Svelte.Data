import type { AsyncState } from "$lib/async/AsyncState.js";

/** Optional parameters */
export interface IAsyncDataOptions<T> {
	/** Called when there has been a change to `AsyncState` */
	setValue?: (value: AsyncState<T>) => void;

	/** Value to set when panding */
	placeholder?: T;

	/** Set to false if you don't want to immediately invoke promise */
	immediatelyInvoked?: boolean;

	/** Set to true if you don't want promise to be invoked server-side */
	browserOnly?: boolean;

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
	public setValue?: (value: AsyncState<T>) => void;

	/** Promise used to fetch the data */
	public promise: () => Promise<T>;

	/** @inheritdoc */
	public placeholder?: T;

	/** @inheritdoc */
	public browserOnly: boolean;

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
		this.setValue = options?.setValue;
		this.placeholder = options?.placeholder;
		this.browserOnly = options?.browserOnly ?? false;
		this.cooldown = options?.cooldown ?? 0;
		this.interval = options?.interval;
		this.handleError = options?.handleError;
		if (options?.immediatelyInvoked ?? true) {
			this.invoke();
		}
		if (typeof window !== "undefined" && typeof this.interval === "number") {
			this._interval = window.setInterval(() => this.invoke(true), this.interval);
		}
	}

	/** Call to invoke or re-invoke promise
	 * @param silent Set to true if we should not call `setValue` with placeholder before invoking promise */
	public async invoke(silent?: boolean): Promise<void> {
		if (this.browserOnly && typeof window === "undefined") {
			return;
		}
		if (this.cooldown > 0 && this.lastFetched) {
			const diff = new Date().getTime() - this.lastFetched.getTime();
			if (diff < this.cooldown) {
				console.info(`Refresh on cooldown (${this.cooldown - diff}ms)`);
				return;
			}
		}
		try {
			if (!silent) {
				this.setValue?.(this.placeholder);
			}
			const res = await this.promise();
			this.setValue?.(res);
		} catch (e) {
			if (typeof this.handleError === "function") {
				this.handleError(e as Error);
			} else {
				console.error(e);
				this.setValue?.(e as Error);
			}
		}
		this.lastFetched = new Date();
	}

	/** If `interval` is set, this should preferrably be called `onDestroy` */
	public clearInterval(): void {
		if (typeof window !== "undefined") window.clearInterval(this._interval);
	}
}
