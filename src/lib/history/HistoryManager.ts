import {deepCopy} from "$lib/shared/deepCopy";

export type HistoryManagerOptions<T> = {
	setValue?: (value: T) => void;
	setIndex?: (index: number) => void;
	setHistory?: (value: T[]) => void;
	ensureT?: (value: unknown) => value is T;
	cap?: number;
};

export class HistoryManager<T> {
	public constructor(options?: HistoryManagerOptions<T>) {
		this.cap = options?.cap;
		this.ensureT = options?.ensureT;
		this.setValue = options?.setValue;
		this.setIndex = options?.setIndex;
		this.setHistory = options?.setHistory;
	}

	public history: T[] = [];
	public index = -1;
	public cap?: number = 10;
	private setValue?: (value: T) => void;
	private setIndex?: (index: number) => void;
	private setHistory?: (value: T[]) => void;
	private ensureT?: (value: unknown) => value is T;
	private ignoreNext = false;

	public addEntry(value: unknown): boolean {
		if (this.ignoreNext || !this.ensureT?.(value)) {
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

	public undo(): void {
		if (this.index > 0) {
			this.ignoreNext = true;
			this.setValue?.(deepCopy<T>(this.history[--this.index]));
			this.setIndex?.(this.index);
		}
	}

	public redo(): void {
		if (this.index < this.history.length - 1) {
			this.ignoreNext = true;
			this.setValue?.(deepCopy<T>(this.history[++this.index]));
			this.setIndex?.(this.index);
		}
	}
}
