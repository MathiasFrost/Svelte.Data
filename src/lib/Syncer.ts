import type { Writable } from "svelte/store";
import type { AsyncData } from "./async/AsyncData";
import type { AsyncState } from "./async/AsyncState";

/** */
export class Local<T> {
	private _value: T;
	public constructor(val: T) {
		this._value = val;
	}
	public get value(): T {
		return this._value;
	}
	public set value(val) {
		this._value = val;
	}
}

/** */
export class LocalHistoric<T> extends Local<T> {
	public constructor(val: T) {
		super(val);
	}
}

/** */
export class LocalAsync<T> extends Local<AsyncState<T>> {
	public constructor(promise: () => Promise<T>) {
		super(void 0);
	}
}

/** */
export class LocalAsyncHistoric<T> extends LocalAsync<T> {
	public constructor(promise: () => Promise<T>) {
		super(promise);
	}
}

/** */
export type WritableHistoric<T> = Writable<{ value: T; index: number; history: T[] }>;

/** */
export type WritableAsync<T> = Writable<{ value: T; data: AsyncData<T> }>;

/** */
export type WritableAsyncHistoric<T> = Writable<WritableHistoric<T> & { data: AsyncData<T> }>;
