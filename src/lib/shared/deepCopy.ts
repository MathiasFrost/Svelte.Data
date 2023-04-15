import { isObject, type UnknownObject } from "./UnknownObject.js";

/** @internal */
const primitives = ["undefined", "string", "number", "bigint", "boolean", "function", "symbol"];

/** Create an entirely new instance of a variable, including objects with objects as properties */
export function deepCopy<T>(something: T): T {
	if (primitives.includes(typeof something) || something === null) {
		return something;
	}
	if (Array.isArray(something)) {
		return something.map((el) => deepCopy(el)) as T;
	}
	if (isObject(something)) {
		const copy: UnknownObject = {};
		const keys = Object.keys(something);
		for (const key of keys) {
			const el = something[key];
			if (typeof el === "function") {
				copy[key] = el.bind(copy);
			} else if (Array.isArray(el)) {
				copy[key] = el.map((e) => deepCopy(e));
			}
			// Special treatment for Date
			else if (el instanceof Date) {
				copy[key] = new Date(el.valueOf());
			} else if (typeof el === "object") {
				copy[key] = deepCopy(el);
			} else {
				copy[key] = el;
			}
		}
		return copy as T;
	}

	return something;
}
