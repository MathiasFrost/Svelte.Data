/** Wrapper around a value to synchronize value/promise for rendering pending/resolved/reject states in `#await` blocks while preserving mutability */
export class Awaitable<T> {
	/** */
	public constructor(promise?: Promise<T>, initialValue?: T) {
		if (typeof initialValue !== "undefined") {
			this.value = initialValue;
		} else if (promise instanceof Promise) {
			this.promise = promise;
		}
	}

	/** */
	private _promise: Promise<T> = new Promise(() => void 0);

	/** */
	public get promise(): Promise<T> {
		return this._promise;
	}

	/** */
	public set promise(v: Promise<T>) {
		this._promise = v;
		this._promise.then((res) => (this._value = res)).catch((e) => (this._error = e));
	}

	/** */
	public get hasValue(): boolean {
		return typeof this._value !== "undefined";
	}

	/** */
	private _value?: T;

	/** */
	public get value(): T {
		if (typeof this._value === "undefined") throw new Error("No value");
		return this._value;
	}

	/** */
	public set value(v: T) {
		this._value = v;
	}

	/** */
	public get hasError(): boolean {
		return typeof this._error !== "undefined";
	}

	/** */
	private _error?: Error;

	/** */
	public get error(): Error {
		if (typeof this._error === "undefined") throw new Error("No error");
		return this._error;
	}

	/** */
	public set error(v: Error) {
		this._error = v;
		this._promise = Promise.reject(v);
	}
}
