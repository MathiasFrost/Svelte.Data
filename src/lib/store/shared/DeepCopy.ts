/** */
export function deepCopy<T>(value: T): T {
	let copy: T;
	if (Array.isArray(value)) {
		copy = value.map((el) => deepCopy(el)) as T;
	} else if (typeof value === "object" && value !== null) {
		copy = {} as T;
		const keys = Object.keys(value);
		for (const key of keys) {
			const el = value[key];
			if (Array.isArray(el)) {
				copy[key] = el.map((e) => deepCopy(e));
			}
			// Special treatment for Date
			else if (el instanceof Date) {
				copy[key] = new Date(el.valueOf());
			} else if (typeof el === "object" && el !== null) {
				copy[key] = deepCopy(el);
			} else {
				copy[key] = el;
			}
		}
	} else {
		copy = value;
	}

	return copy;
}
