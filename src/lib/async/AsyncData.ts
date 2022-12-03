import type {AsyncState} from "$lib/async/AsyncState";

export type AsyncDataOptions<T> = {
	setValue?: (value: AsyncState<T>) => void;
	placeholder?: T;
	resolveImmediately?: boolean;
	browserOnly?: boolean;
};

export class AsyncData<T> {
	public setValue?: (value: AsyncState<T>) => void;

	public promise: () => Promise<T>;

	public placeholder?: T;

	public value: AsyncState<T>;

	public browserOnly: boolean;

	constructor(promise: () => Promise<T>, options?: AsyncDataOptions<T>) {
		this.promise = promise;
		this.setValue = options?.setValue;
		this.placeholder = options?.placeholder;
		this.value = this.placeholder;
		this.browserOnly = options?.browserOnly ?? false;
		if (options?.resolveImmediately ?? true) {
			this.refresh();
		}
	}

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
