import { deepCopy } from "./shared/deepCopy";
import type { Deserializer, Serializer } from "./sync/defaultSerializers";

export function localStorageVariable<T>(
	key: string,
	initialValue: T,
	deserializer: Deserializer<T> = (str) => JSON.parse(str),
	serializer: Serializer<T> = (value) => JSON.stringify(value)
): [T, (value: T) => false] {
	let value = initialValue;
	if (typeof window !== "undefined") {
		const str = window.localStorage.getItem(key);
		if (str !== null) value = deserializer(str);
	}
	const updater: (newValue: T) => false = (newValue: T) => {
		if (typeof window !== "undefined") window.localStorage.setItem(key, serializer(newValue));
		return false;
	};
	return [value, updater];
}

export function localStorageString(key: string, initialValue = ""): [string, (value: string) => false] {
	return localStorageVariable<string>(
		key,
		initialValue,
		(str) => str,
		(str) => str
	);
}

export function historic<T>(set: (value: T) => void) {
	let index = 0;
	let ignoreNext = false;
	const history: T[] = [];

	const undo = () => {
		if (index > 0) {
			ignoreNext = true;
			set(deepCopy<T>(history[--index]));
		}
	};

	const addEntry = (value: T) => {
		console.log(value);
		if (ignoreNext) return;
		history.push(deepCopy(value));
		index = history.length - 1;
	};

	return {
		index,
		undo,
		addEntry
	};
}
