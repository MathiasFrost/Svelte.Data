import {deepCopy} from "$lib/shared/deepCopy";

export type HistoryManagerOptions<T> = {
	setValue?: (value: T) => void;
	setIndex?: (index: number) => void;
	setHistory?: (value: T[]) => void;
	condition?: (value: T) => boolean;
	cap?: number;
};

export class HistoryManager<T> {
	public constructor(options?: HistoryManagerOptions<T>) {
		this.cap = options?.cap;
		this.condition = options?.condition;
		this.setValue = options?.setValue;
		this.setIndex = options?.setIndex;
		this.setHistory = options?.setHistory;
	}

	public history: T[] = [];
	public index = -1;
	public setValue?: (value: T) => void;
	public setIndex?: (index: number) => void;
	public setHistory?: (value: T[]) => void;
	public condition?: (value: T) => boolean;
	public cap?: number = 10;
	private ignoreNext = false;

	public addEntry(value: T): boolean {
		if (this.ignoreNext || (typeof this.condition === "function" && !this.condition(value))) {
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
