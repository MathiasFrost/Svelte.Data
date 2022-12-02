export type AsyncDataOptions<T> = {
	setValue?: (value: undefined | T | Error) => void;
	placeholder?: T;
};

export class AsyncData<T> {
	private setValue?: (value: undefined | T | Error) => void;

	private promise: () => Promise<T>;

	public placeholder?: T;

	public value: undefined | T | Error;

	constructor(promise: () => Promise<T>, options?: AsyncDataOptions<T>) {
		this.promise = promise;
		this.setValue = options?.setValue;
		this.placeholder = options?.placeholder;
		this.value = this.placeholder;
		this.refresh();
	}

	public async refresh(silent?: boolean): Promise<void> {
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
