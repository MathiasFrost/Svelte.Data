/** Wrapper around a value to synchronize value/promise for rendering pending/resolved/reject states in `#await` blocks while preserving mutability */
export class AsyncValue<T> {
	/** */
	public constructor(promise?: Promise<T>) {
		if (promise instanceof Promise) {
			this.promise = promise;
		}
	}

	/** */
	private _promise: Promise<T> = new Promise((resolve, reject) => {
		this._resolve = resolve;
		this._reject = reject;
	});

	/** */
	public set promise(v: Promise<T>) {
		this._promise = v;
		this._promise.then((res) => (this._value = res)).catch((e) => (this._error = e));
	}

	/** */
	public get promise(): Promise<T> {
		return this._promise;
	}

	/** */
	private fallback?: T;

	/** */
	private _resolve?: (res: T) => void;

	/** */
	public resolve(res: T): void {
		console.log(this);
		this._resolve?.(res);
		this._value = res;
	}

	/** */
	private _reject?: (e: Error) => void;

	/** */
	private _value?: T;
	public get hasValue(): boolean {
		return !!this._value;
	}

	/** */
	private _error?: Error;
	public get hasError(): boolean {
		return !!this._error;
	}

	/** */
	public reset(): void {
		this._value = void 0;
	}

	/** */
	public get value(): T {
		if (typeof this._value === "undefined") throw new Error("No value");
		return this._value;
	}
	public set value(v: T) {
		this._value = v;
		this._promise = Promise.resolve(v);
	}

	/** */
	public get error(): Error {
		if (typeof this._error === "undefined") throw new Error("No error");
		return this._error;
	}
	public set error(v: Error) {
		this.error = v;
	}
}
