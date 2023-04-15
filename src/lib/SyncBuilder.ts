import { writable, type Writable } from "svelte/store";

export type SyncBuilderResult<T> = {
	value: T;
	update: (value: T) => void;
	invoke: () => void;
	error: Error | null;
	historyIndex: number;
	history: string[];
	undo: () => void;
	redo: () => void;
	addEntry: (value: T) => void;
};

/** */
export class SyncBuilder<T> {
	/** */
	public initialValue: T;

	/** */
	public constructor(initialValue: T) {
		this.initialValue = initialValue;
	}

	/** */
	public setters: ((value: T) => void)[] = [];

	/** */
	public getters: (() => T | undefined)[] = [];

	/** */
	public promises: (() => Promise<T>)[] = [];

	/** */
	public history = false;

	/** */
	private serializer: (value: T) => string = (value) => JSON.stringify(value);

	/** */
	private deserializer: (string: string) => T = (string) => JSON.parse(string);

	/** */
	public withSerializer(serializer: (value: T) => string): SyncBuilder<T> {
		this.serializer = serializer;
		return this;
	}

	/** */
	public withDeserializer(deserializer: (string: string) => T): SyncBuilder<T> {
		this.deserializer = deserializer;
		return this;
	}

	/** */
	public toLocalStorage(key: string): SyncBuilder<T> {
		this.setters.push((value) => {
			if (typeof window === "undefined") return;
			window.localStorage.setItem(key, this.serializer(value));
		});
		return this;
	}

	/** */
	public to(destination: (value: T) => void): SyncBuilder<T> {
		this.setters.push(destination);
		return this;
	}

	/** */
	public from(source: () => T): SyncBuilder<T> {
		this.getters.push(source);
		return this;
	}

	/** */
	public fromLocalStorage(key: string): SyncBuilder<T> {
		this.getters.push(() => {
			if (typeof window === "undefined") return void 0 as T;
			const string = window.localStorage.getItem(key);
			if (string === null) return void 0 as T;
			return this.deserializer(string);
		});
		return this;
	}

	/** */
	public withHistory(): SyncBuilder<T> {
		this.history = true;
		return this;
	}

	/** */
	public fromPromise(promise: () => Promise<T>): SyncBuilder<T> {
		this.promises.push(promise);
		return this;
	}

	/** */
	public asWritable() {
		return writable<T>();
	}

	/** */
	public withCatch(catcher: (e: Error) => void): SyncBuilder<T> {
		this.catcher = catcher;
		return this;
	}

	/** */
	private catcher?: (e: Error) => void;

	/** */
	private historySetter?: (entries: string[]) => void;

	/** */
	private historyIndexSetter?: (index: number) => void;

	/** */
	public historyTo(setter: (entries: string[]) => void): SyncBuilder<T> {
		this.historySetter = setter;
		return this;
	}

	/** */
	public historyIndexTo(setter: (index: number) => void): SyncBuilder<T> {
		this.historyIndexSetter = setter;
		return this;
	}

	/** @returns The components as an anonymous object */
	public asObject(): SyncBuilderResult<T> {
		let valueInternal = this.initialValue;
		for (const getter of this.getters) {
			const val = getter();
			if (typeof val === "undefined") continue;
			valueInternal = val;
		}

		let index = 0;
		const history: string[] = [this.serializer(valueInternal)];

		let ignoreNext = false;

		const addEntry = (value: T) => {
			if (ignoreNext) {
				ignoreNext = false;
				return;
			}
			const str = this.serializer(value);
			if (str === valueInternal) return; // Don't add duplicate adjacent entries
			history.push(str);
			index++;
			this.historySetter?.(history);
			this.historyIndexSetter?.(index);
		};

		const update: (value: T) => false = (value) => {
			for (const setter of this.setters) {
				setter(value);
			}
			addEntry(value);
			valueInternal = value;
			return false;
		};

		const undo = () => {
			if (index > 0) {
				ignoreNext = true;
				update(this.deserializer(history[--index]));
				this.historyIndexSetter?.(index);
			}
		};

		const redo = () => {
			if (index < history.length - 1) {
				ignoreNext = true;
				update(this.deserializer(history[++index]));
				this.historyIndexSetter?.(index);
			}
		};

		const invoke = () => {
			const invokePromise = async (index: number) => {
				try {
					const res = await this.promises[index]();
					update(res);
				} catch (e) {
					if (typeof this.catcher === "function") this.catcher(e as Error);
					else console.error(e);
					if (++index < this.promises.length - 1) invokePromise(++index);
				}
			};
			invokePromise(0);
		};

		const error: Error | null = null;

		return { value: valueInternal, update, invoke, error, addEntry, undo, redo, history, historyIndex: index };
	}

	/** */
	public asWritableHistoric(): Writable<T> {
		return writable<T>();
	}
}
