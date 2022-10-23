/** For initializing localStorage, sessionStorage */
export interface StorageInit<T> {
	/** key Key to store data in storage */
	key: string;

	/** initialValue Optional initial value */
	initialValue?: T;

	/** transform Optional predicate to transform storage value to desired type. Otherwise will naively call JSON.parse */
	transform?: (json: string) => T;
}
