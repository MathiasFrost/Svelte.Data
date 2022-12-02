import type {Writable} from "svelte/store";

export type AsyncDataOptions<T> = {
	setValue?: (value: undefined | T | Error) => void;
	placeholder?: T;
	store?: Writable<undefined | T | Error>;
};

export class AsyncData<T> {
	private setValue?: (value: undefined | T | Error) => void;

	private promise: () => Promise<T>;

	public placeholder?: T;

	public value: undefined | T | Error;

	public store?: Writable<undefined | T | Error>;

	constructor(promise: () => Promise<T>, options?: AsyncDataOptions<T>) {
		this.promise = promise;
		this.setValue = options?.setValue;
		this.placeholder = options?.placeholder;
		this.value = this.placeholder;
		this.store = options?.store;
		this.refresh();
	}

	private set(value: undefined | T | Error) {
		this.store?.set(value);
		this.setValue?.(value);
	}

	public async refresh(silent?: boolean): Promise<void> {
		try {
			if (!silent) {
				this.set(this.placeholder);
			}
			const res = await this.promise();
			this.set(res);
		} catch (e) {
			console.error(e);
			this.set(e as Error);
		}
	}
}
