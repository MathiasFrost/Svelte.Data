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
export class SyncBuilder<TValue> {
	/** */
	public initialValue: TValue;

	/** */
	public constructor(initialValue: TValue) {
		this.initialValue = initialValue;
	}

	/** */
	public setters: ((value: TValue) => void)[] = [];

	/** */
	public alwaysInvoke = true;

	/** */
	public getters: (() => TValue | undefined)[] = [];

	/** */
	public promises: (() => Promise<TValue>)[] = [];

	/** */
	public history = false;

	/** */
	private key?: string;

	/** */
	private serializer: (value: TValue) => string = (value) => JSON.stringify(value);

	/** */
	private deserializer: (string: string) => TValue = (string) => JSON.parse(string);

	/** */
	public withSerializer(serializer: (value: TValue) => string): SyncBuilder<TValue> {
		this.serializer = serializer;
		return this;
	}

	/** */
	public withDeserializer(deserializer: (string: string) => TValue): SyncBuilder<TValue> {
		this.deserializer = deserializer;
		return this;
	}

	/** */
	public toLocalStorage(key?: string): SyncBuilder<TValue> {
		this.setters.push((value) => {
			if (typeof window === "undefined") return;
			window.localStorage.setItem(this.getKey(key), this.serializer(value));
		});
		return this;
	}

	/** */
	public to(destination: (value: TValue) => void): SyncBuilder<TValue> {
		this.setters.push(destination);
		return this;
	}

	/** */
	public from(source: () => TValue): SyncBuilder<TValue> {
		this.alwaysInvoke = true;
		this.getters.push(source);
		return this;
	}

	private getKey(key?: string): string {
		if (this.key && !key) return this.key;
		if (key && !this.key) {
			this.key = key;
			return this.key;
		}
		if (key) return key;
		throw new Error("Key has not been defined");
	}

	/** */
	public fromLocalStorage(key?: string): SyncBuilder<TValue> {
		this.alwaysInvoke = true;
		this.getters.push(() => {
			if (typeof window === "undefined") return void 0 as TValue;
			const string = window.localStorage.getItem(this.getKey(key));
			if (string === null) return void 0 as TValue;
			return this.deserializer(string);
		});
		return this;
	}

	/** */
	public withHistory(): SyncBuilder<TValue> {
		this.history = true;
		return this;
	}

	/** */
	public fromPromise(promise: () => Promise<TValue>): SyncBuilder<TValue> {
		this.alwaysInvoke = false;
		this.promises.push(promise);
		return this;
	}

	/** */
	public asWritable() {
		return writable<TValue>();
	}

	/** */
	public withCatch(catcher: (e: Error) => void): SyncBuilder<TValue> {
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
	public historyTo(setter: (entries: string[]) => void): SyncBuilder<TValue> {
		this.historySetter = setter;
		return this;
	}

	/** */
	public historyIndexTo(setter: (index: number) => void): SyncBuilder<TValue> {
		this.historyIndexSetter = setter;
		return this;
	}

	/** @returns The components as an anonymous object */
	public asObject(): SyncBuilderResult<TValue> {
		let gotFromGetters = false;
		let valueInternal = this.initialValue;
		for (const getter of this.getters) {
			const val = getter();
			if (typeof val === "undefined") continue;
			valueInternal = val;
			gotFromGetters = true;
		}

		let index = 0;
		const history: string[] = typeof valueInternal === "undefined" ? [] : [this.serializer(valueInternal)];

		let ignoreNext = false;

		const addEntry = (value: TValue) => {
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

		const update: (value: TValue) => false = (value) => {
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
			if (!this.alwaysInvoke && gotFromGetters) {
				this.alwaysInvoke = true;
				return;
			}
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
	public asWritableHistoric(): Writable<TValue> {
		return writable<TValue>();
	}
}
