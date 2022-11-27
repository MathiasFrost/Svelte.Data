import type {UnknownObject} from "./UnknownObject";

/** */
export function deepCopy<T>(value: T): T {
	let copy: T;
	if (Array.isArray(value)) {
		copy = value.map((el) => deepCopy(el)) as T;
	} else if (typeof value === "object" && value !== null) {
		copy = {} as T;
		const keys = Object.keys(value);
		for (const key of keys) {
			const el = (value as UnknownObject)[key];
			if (Array.isArray(el)) {
				(copy as UnknownObject)[key] = el.map((e) => deepCopy(e));
			}
			// Special treatment for Date
			else if (el instanceof Date) {
				(copy as UnknownObject)[key] = new Date(el.valueOf());
			} else if (typeof el === "object" && el !== null) {
				(copy as UnknownObject)[key] = deepCopy(el);
			} else {
				(copy as UnknownObject)[key] = el;
			}
		}
	} else {
		copy = value;
	}

	return copy;
}
