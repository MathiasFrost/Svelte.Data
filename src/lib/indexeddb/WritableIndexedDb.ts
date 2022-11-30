import {writable, type Updater, type Writable} from "svelte/store";
import type {WritableStorageOptions} from "../shared/WritableStorage";

/** */
export type WritableIndexedDB<T> = Writable<T> & {
	/** Name of the database */
	database: string;

	/** Name of the table */
	table: string;

	/** Set store value to the data stored in cookie */
	reset(): void;
};

/** Table definition and Optional parameters */
export type WritableIndexedDBOptions<T> = WritableStorageOptions<T> & {
	/** Database version */
	version?: number;

	/** First column is key. If not specified, initialValue must be set. This will be used to infer the columns. */
	columns?: string[];
};

/** @internal */
export function __writableIndexedDB<T>(database: string, table: string, options: WritableIndexedDBOptions<T>, store?: Writable<T>): WritableIndexedDB<T> {
	const {subscribe, set: _set, update: _update} = store ?? writable<T>(options.initialValue, options?.start);

	function getResult<T>(event: Event): T | null {
		if (!event.target || !("result" in event.target)) {
			return null;
		}
		return (<{result: T}>event.target).result;
	}

	function startGetValue(): void {
		const connection = typeof window === "undefined" ? null : window.indexedDB.open(database, options.version);
		if (!connection) {
			return;
		}
		connection.onerror = handleError;
		connection.onsuccess = (event) => {
			const db = connection.result;
			const transaction = db.transaction(table);
			transaction.onerror = handleError;

			const store = transaction.objectStore(table);
			const openRequest = store.openCursor();
			openRequest.onerror = handleError;
			openRequest.onsuccess = (event) => {
				const cursor = getResult<IDBCursor>(event);
				if (!cursor) {
					// Finished reading
					return;
				}
				console.log(cursor);
			};
		};
		connection.onupgradeneeded = (event) => {
			const db = getResult<IDBDatabase>(event);
			if (!db) {
				return;
			}
			db.onerror = handleError;

			// Create an objectStore for this database
			if (!options.columns && !options.initialValue) throw new Error("Either columns or initialValue must be provided");

			const columns = options.columns ?? Object.keys(options.initialValue ?? {});
			const objectStore = db.createObjectStore(table, {keyPath: columns[0]});

			// Define what data items the objectStore will contain
			for (const column of columns) {
				objectStore.createIndex(column, column, {unique: false});
			}
		};
	}

	function handleError(e: unknown) {
		console.error(e);
		if (options?.initialValue) {
			set(options.initialValue);
		}
		throw new Error(`Could not retrieve value from cookie and no initial value was provided. Name: ${name}`);
	}

	function setValue(value: T): void {
		if (typeof document === "undefined") {
			return;
		}
		try {
			options ??= {};
		} catch (error) {
			console.error(error);
		}
	}

	function set(value: T): void {
		setValue(value);
		_set(value);
	}

	function update(this: void, updater: Updater<T>): void {
		_update((prev) => {
			const value = updater(prev);
			setValue(value);
			return value;
		});
	}

	function reset(): void {
		startGetValue();
	}

	startGetValue();

	return {
		database,
		table,
		subscribe,
		set,
		update,
		reset
	};
}

/** */
export function writableIndexedDB<T>(database: string, table: string, options: WritableIndexedDBOptions<T>): WritableIndexedDB<T> {
	return __writableIndexedDB<T>(database, table, options);
}
