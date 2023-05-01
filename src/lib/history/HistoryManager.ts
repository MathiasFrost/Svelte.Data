import type { ITransformer } from "$lib/types/ITransformer.js";
import { anyTransformer } from "$lib/types/transformers.js";

/** Options */
export interface IHistoryManagerOptions<T> {
	/** Called when manager wants to set the value we are tracking */
	onChange: (value: T) => void;

	/** Called when manager wants to set the value we are tracking */
	onHistoryChange: (history: string[], index: number) => void;

	/** For converting value to and from its string representation */
	transformer: ITransformer<T>;

	/** Limit how many changes can be stored */
	cap: number;
}

/** Keep track of changes to a variable */
export class HistoryManager<T> {
	/** Keep track of changes to a variable
	 * @param options Optional parameters */
	public constructor(options: Partial<IHistoryManagerOptions<T>> = {}) {
		this.cap = options.cap ?? 10;
		this.onChange = options.onChange;
		this.onHistoryChange = options.onHistoryChange;
		this.transformer = options.transformer ?? anyTransformer();
	}

	/** Array of stored changes */
	public history: string[] = [];

	/** Current element of `history` we are at */
	public index = -1;

	/** Limit how many changes can be stored */
	public cap: number;

	/** Called when manager wants to set the value we are tracking */
	public onChange?: (value: T) => void;

	/** Called when manager wants to set the value we are tracking */
	public onHistoryChange?: (history: string[], index: number) => void;

	/** */
	public transformer: ITransformer<T>;

	/** Set to true when we want manager to ignore next change and not add it to history */
	public ignoreNext = false;

	/** Add an entry to history */
	public addEntry(value: T): void {
		if (this.ignoreNext) {
			this.ignoreNext = false;
			return;
		}

		const len = this.history.length;
		if (this.cap > 0 && len >= this.cap && this.index === len - 1) {
			this.history.splice(0, 1);
			this.index = this.history.length - 1;
		}

		this.history = [...this.history.slice(0, ++this.index), this.transformer.serialize(value)];
		this.onHistoryChange?.(this.history, this.index);
	}

	/** Set value to its previous state */
	public undo(): void {
		if (this.index > 0) {
			this.ignoreNext = true;
			this.onChange?.(this.transformer.deserialize(this.history[--this.index]));
			this.onHistoryChange?.(this.history, this.index);
		}
	}

	/** Set value to it's state before `undo` */
	public redo(): void {
		if (this.index < this.history.length - 1) {
			this.ignoreNext = true;
			this.onChange?.(this.transformer.deserialize(this.history[++this.index]));
			this.onHistoryChange?.(this.history, this.index);
		}
	}

	/** Serialize history data to string. Useful for storing history in something like `localStorage` */
	public serialize(): string {
		return JSON.stringify({ history: this.history, index: this.index });
	}

	/** */
	public deserialize(json: string): T | undefined {
		const o = JSON.parse(json);
		this.history = o.history;
		this.index = o.index;

		const string = this.history[this.index];
		if (typeof string === "undefined") return undefined;

		this.ignoreNext = true;
		return this.transformer.deserialize(string);
	}
}
