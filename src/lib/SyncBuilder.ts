/** */
type Get<T> = () => T | Promise<T>;

/** */
type Set<T> = (value: T | Promise<T>) => void;

/** */
type Getter<T> = {
	awaited: boolean;
	get: Get<T>;
};

/** */
type Setter<T> = {
	awaited: boolean;
	set: Set<T>;
};

/** */
function isFunction<T>(getter: Get<T>): getter is Get<T> {
	return typeof getter === "function";
}

/** */
export type Data<T> = {
	/** Push a value to destinations defined with `.to{Something?}` */
	push: (value: T | Promise<T>) => Data<T>;

	/** Get value from the first successful source defined with `.from{Something?}` */
	pull: () => Data<T>;

	/** Resets data state, clearing storages */
	reset: () => Data<T>;

	/** Add getters with higher priority than existing */
	unshiftFrom: (...getters: Get<T>[]) => Data<T>;

	/** Add getters with higher priority than existing and await them before processing */
	unshiftFromAwaited: (...getters: Get<T>[]) => Data<T>;

	/** Add getters with lower priority than existing */
	pushFrom: (...getters: Get<T>[]) => Data<T>;

	/** Add getters with lower priority than existing and await them before processing */
	pushFromAwaited: (...getters: Get<T>[]) => Data<T>;

	/** Add setters with lower priority than existing */
	pushTo: (...setters: Set<T>[]) => Data<T>;

	/** Add setters with lower priority than existing and await them before processing */
	pushToAwaited: (...setters: Set<T>[]) => Data<T>;
};

/** */
export class DataBuilder<T> {
	/** */
	public setters: Setter<T>[] = [];

	/** */
	public alwaysInvoke = true;

	/** */
	public getters: Getter<T>[] = [];

	/** */
	public history = false;

	/** */
	private key?: string;

	/** */
	private serializer: (value: T) => string = (value) => JSON.stringify(value);

	/** */
	private deserializer: (string: string) => T = (string) => JSON.parse(string);

	/** */
	public isString(): DataBuilder<T> {
		this.serializer = (value) => value as string;
		this.deserializer = (str) => str as T;
		return this;
	}

	/** */
	public withSerializer(serializer: (value: T) => string): DataBuilder<T> {
		this.serializer = serializer;
		return this;
	}

	/** */
	public withDeserializer(deserializer: (string: string) => T): DataBuilder<T> {
		this.deserializer = deserializer;
		return this;
	}

	/** */
	public to(setter: (value: T) => void): DataBuilder<T> {
		this.setters.push({ awaited: false, set: setter as Set<T> }); // Difference is handled by awaited prop
		return this;
	}

	/** */
	public toAwaited(setter: (value: Promise<T>) => void): DataBuilder<T> {
		this.setters.push({ awaited: true, set: setter as Set<T> }); // Difference is handled by awaited prop
		return this;
	}

	/** */
	public from(getter: Get<T>): DataBuilder<T> {
		this.alwaysInvoke = true;
		this.getters.push({ awaited: false, get: isFunction(getter) ? getter : () => getter });
		return this;
	}

	/** */
	public fromAwaited(getter: Get<T>): DataBuilder<T> {
		this.alwaysInvoke = true;
		this.getters.push({ awaited: true, get: isFunction(getter) ? getter : () => getter });
		return this;
	}

	/** */
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
	public toSessionStorage(key?: string): DataBuilder<T> {
		this.setters.push({
			awaited: true, // Awaited is true so value is always resolved
			set: (value) => {
				window.sessionStorage.setItem(this.getKey(key), this.serializer(value as T));
			}
		});
		return this;
	}

	/** */
	public fromSessionStorage(key?: string): DataBuilder<T> {
		this.alwaysInvoke = true;
		this.getters.push({
			awaited: false,
			get: () => {
				const string = window.sessionStorage.getItem(this.getKey(key));
				if (string === null) throw new Error("Key not found");
				return this.deserializer(string);
			}
		});
		return this;
	}

	/** */
	public asObject(): Data<T> {
		const data: Data<T> = {
			reset() {
				return data;
			},
			push() {
				return data;
			},
			pull() {
				return data;
			},
			unshiftFromAwaited() {
				return data;
			},
			unshiftFrom() {
				return data;
			},
			pushToAwaited() {
				return data;
			},
			pushTo() {
				return data;
			},
			pushFromAwaited() {
				return data;
			},
			pushFrom() {
				return data;
			}
		};

		data.push = (value) => {
			this.setters.forEach(async (setter, i) => {
				try {
					if (setter.awaited) setter.set(await value);
					else setter.set(value);
				} catch (e) {
					console.error(`Setter ${i} threw an exception: ${e}`);
				}
			});
			return data;
		};
		data.pull = () => {
			const _pull = async () => {
				for (const getter of this.getters) {
					try {
						const value = getter.awaited ? await getter.get() : getter.get();
						data.push(value);
						return;
					} catch (e) {
						console.error(`Getter ${this.getters.indexOf(getter)} threw en exception: ${e}`);
					}
				}
			};
			_pull();
			return data;
		};
		data.reset = () => {
			window.sessionStorage.removeItem(this.key ?? "");
			return data;
		};
		data.pushFrom = (...getters) => {
			this.getters = getters.map((getter) => ({ awaited: false, get: isFunction(getter) ? getter : () => getter }));
			return data;
		};
		data.pushFromAwaited = (...getters) => {
			this.getters = getters.map((getter) => ({ awaited: true, get: isFunction(getter) ? getter : () => getter }));
			return data;
		};
		data.unshiftFrom = (...getters) => {
			this.getters.unshift(...getters.map((getter) => ({ awaited: false, get: isFunction(getter) ? getter : () => getter })));
			return data;
		};
		data.unshiftFromAwaited = (...getters) => {
			this.getters.unshift(...getters.map((getter) => ({ awaited: true, get: isFunction(getter) ? getter : () => getter })));
			return data;
		};
		data.pushTo = (...setters) => {
			this.setters.unshift(...setters.map((setter) => ({ awaited: false, set: setter })));
			return data;
		};
		data.pushToAwaited = (...setters) => {
			this.setters.unshift(...setters.map((setter) => ({ awaited: true, set: setter })));
			return data;
		};

		data.pull();
		return data;
	}
}
