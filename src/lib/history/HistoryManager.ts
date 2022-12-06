import { deepCopy } from "$lib/shared/deepCopy.js";

/** Optional parameters */
export type HistoryManagerOptions<T> = {
	/** Called when manager wants to set the value we are tracking */
	setValue?: (value: T) => void;

	/** Called when manager has changed history index */
	setIndex?: (index: number) => void;

	/** Called when manager has changed history array */
	setHistory?: (value: T[]) => void;

	/** Called before manager adds value to history */
	ensureT?: (value: unknown) => value is T;

	/** Limit how many changes can be stored */
	cap?: number;
};

/** @internal */
function defaultEnsureT<T>(_value: unknown): _value is T {
	return true;
}

/** Keep track of changes to a variable */
export class HistoryManager<T> {
	/** Keep track of changes to a variable
	 * @param options Optional parameters */
	public constructor(options?: HistoryManagerOptions<T>) {
		this.cap = options?.cap;
		this.ensureT = options?.ensureT ?? defaultEnsureT;
		this.setValue = options?.setValue;
		this.setIndex = options?.setIndex;
		this.setHistory = options?.setHistory;
	}

	/** Array of stored changes */
	public history: T[] = [];

	/** Current element of `history` we are at */
	public index = -1;

	/** Limit how many changes can be stored */
	public cap?: number = 10;

	/** Called when manager wants to set the value we are tracking */
	public setValue?: (value: T) => void;

	/** Called when manager has changed history index */
	public setIndex?: (index: number) => void;

	/** Called when manager has changed history array */
	public setHistory?: (value: T[]) => void;

	/** Called before manager adds value to history */
	public ensureT: (value: unknown) => value is T;

	/** Set to true when we want manager to ignore next change and not add it to history */
	public ignoreNext = false;

	/** Add an entry to history */
	public addEntry(value: unknown): boolean {
		if (this.ignoreNext || !this.ensureT(value)) {
			this.ignoreNext = false;
			return false;
		}
		const copy = deepCopy<T>(value);
		const len = this.history.length;
		if (typeof this.cap === "number" && len >= this.cap && this.index === len - 1) {
			this.history.splice(0, 1);
			this.index = this.history.length - 1;
		}
		this.history = [...this.history.slice(0, ++this.index), copy];
		this.setHistory?.(this.history);
		this.setIndex?.(this.index);
		return false;
	}

	/** Set value to it's previous state */
	public undo(): void {
		if (this.index > 0) {
			this.ignoreNext = true;
			this.setValue?.(deepCopy<T>(this.history[--this.index]));
			this.setIndex?.(this.index);
		}
	}

	/** Set value to it's state before `undo` */
	public redo(): void {
		if (this.index < this.history.length - 1) {
			this.ignoreNext = true;
			this.setValue?.(deepCopy<T>(this.history[++this.index]));
			this.setIndex?.(this.index);
		}
	}
}
