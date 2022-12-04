import type { AsyncState } from "$lib/async/AsyncState";

/** Optional parameters */
export type AsyncDataOptions<T> = {
	/** Called when there has been a change to `AsyncState` */
	setValue?: (value: AsyncState<T>) => void;

	/** Value to set when panding */
	placeholder?: T;

	/** Set to false if you don't want to immediately invoke promise */
	immediatelyInvoked?: boolean;

	/** Set to true if you don't want promise to be invoked server-side */
	browserOnly?: boolean;
};

/** Manage async data */
export class AsyncData<T> {
	/** Called when there has been a change to `AsyncState` */
	public setValue?: (value: AsyncState<T>) => void;

	/** Promise used to fetch the data */
	public promise: () => Promise<T>;

	/** Value to set when panding */
	public placeholder?: T;

	/** Set to true if you don't want promise to be invoked server-side */
	public browserOnly: boolean;

	/** Manage async data
	 * @param promise The promise returning the data
	 * @param options Optional parameters */
	public constructor(promise: () => Promise<T>, options?: AsyncDataOptions<T>) {
		this.promise = promise;
		this.setValue = options?.setValue;
		this.placeholder = options?.placeholder;
		this.browserOnly = options?.browserOnly ?? false;
		if (options?.immediatelyInvoked ?? true) {
			this.refresh();
		}
	}

	/** Call to re-invoke promise
	 * @param silent Set to true if we should not call `setValue` with placeholder before invoking promise */
	public async refresh(silent?: boolean): Promise<void> {
		if (this.browserOnly && typeof window === "undefined") {
			return;
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
	}
}
