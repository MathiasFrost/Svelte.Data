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
}

/** Manage async data */
export class AsyncData<T> implements IAsyncDataOptions<T> {
	/** Called when there has been a change to `AsyncState` */
	public setValue?: (value: AsyncState<T>) => void;

	/** Promise used to fetch the data */
	public promise: () => Promise<T>;

	/** Value to set when panding */
	public placeholder?: T;

	/** Set to true if you don't want promise to be invoked server-side */
	public browserOnly: boolean;

	/** Refresh cooldown in milliseconds. Set to 0 to remove cooldown. */
	public cooldown: number;

	/** When refresh was last called */
	public lastFetched?: Date;

	/** Refetch interval in milliseconds. Will always be silent. */
	public interval?: number;

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
		if (options?.immediatelyInvoked ?? true) {
			this.invoke();
		}
		if (typeof window !== "undefined" && typeof this.interval === "number") {
			window.setInterval(() => this.invoke(true), this.interval);
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
			console.error(e);
			this.setValue?.(e as Error);
		}
		this.lastFetched = new Date();
	}
}
