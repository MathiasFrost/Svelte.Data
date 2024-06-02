import type { Deserializer } from "$lib/types/unknown.js";

export enum TypeCode {
	string,
	number,
	object
}

/** TODOC */
export function Type(expectedType: new (...args: never[]) => unknown): (target: object, propertyKey: string) => void {
	let typeCode: TypeCode;
	if (expectedType === String) {
		typeCode = TypeCode.string;
	} else if (expectedType === Number) {
		typeCode = TypeCode.number;
	} else {
		typeCode = TypeCode.object;
	}

	return function (target: object, propertyKey: string): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		target["__typeCodes"] ??= {};
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		target["__typeCodes"][propertyKey] = typeCode;
	};
}

/** TODOC */
export function Deserializable(target: new (...args: never[]) => object): void {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	target.deserialize = function (input: Record<string, unknown>): unknown {
		const res = new target();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		const typeCodes = res["__typeCodes"] as Record<string, TypeCode>;
		Object.keys(input).forEach((key) => {
			let expected = "";
			let value: unknown;
			switch (typeCodes[key]) {
				case TypeCode.string:
					if (typeof input[key] === "string") {
						value = input[key];
					} else {
						expected = "string";
					}
					break;
				case TypeCode.number:
					if (typeof input[key] === "number") {
						value = input[key];
					} else if (typeof input[key] === "string") {
						value = Number(input[key]);
					} else {
						expected = "number";
					}
					break;
				case TypeCode.object:
					break;
				default:
					throw new Error("Unsupported type");
			}
			if (expected) {
				throw new Error(`Expected type '${expected}' for field '${key}', got type '${typeof input[key]}'`);
			}

			Reflect.set(res, key, value);
		});
		return res;
	};
}

/** TODOC */
function hasDeserializableDecorator<T>(deserializer: Deserializer<T>): deserializer is { deserialize: (something: unknown) => T } {
	return "deserialize" in deserializer && typeof deserializer.deserialize === "function";
}

/** TODOC */
export function deserialize<TResult>(deserializer: Deserializer<TResult> | null, something: unknown): TResult {
	if (something === null || typeof something !== "object") throw new Error("Could not deserialize JSON");

	if (!deserializer) return { ...something } as TResult;
	if (hasDeserializableDecorator(deserializer)) {
		return deserializer.deserialize(something);
	} else {
		try {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			return new deserializer(something);
		} catch (e) {
			if (e instanceof TypeError && e.message.includes("is not a constructor")) {
				console.warn("Deserializer has neither @Deserializable, callable nor a constructor. Returning plain object.");
				return { ...something } as TResult;
			}
			throw e;
		}
	}
}

/** TODOC */
export function formDataToObject(formData: FormData): Record<string, unknown> | unknown[] {
	const result: unknown = {};

	formData.forEach((value, key) => {
		const keys = key.split(/[[\].]+/).filter(Boolean);
		let current = result;

		for (let i = 0; i < keys.length; i++) {
			const keyPart = keys[i];
			const isArrayIndex = /^\d+$/.test(keyPart);
			const isLast = i === keys.length - 1;

			if (isArrayIndex) {
				const index = parseInt(keyPart, 10);
				if (!Array.isArray(current)) {
					current = current && typeof current === "object" ? current : [];
				}
				if (!(current as Record<string, unknown>)[index]) {
					(current as Record<string, unknown>)[index] = isLast ? value : {};
				}
				if (isLast) {
					(current as Record<string, unknown>)[index] = value;
				} else {
					current = (current as Record<string, unknown>)[index];
				}
			} else {
				if (typeof current !== "object" || Array.isArray(current)) {
					current = {};
				}
				if (!(current as Record<string, unknown>)[keyPart]) {
					(current as Record<string, unknown>)[keyPart] = isLast ? value : {};
				}
				if (isLast) {
					(current as Record<string, unknown>)[keyPart] = value;
				} else {
					current = (current as Record<string, unknown>)[keyPart];
				}
			}
		}
	});

	function cleanUp(obj: unknown): unknown {
		if (Array.isArray(obj)) {
			return obj.map(cleanUp);
		} else if (typeof obj === "object" && obj !== null) {
			const keys = Object.keys(obj);
			if (keys.length === 0) return {};
			const isArray = keys.every((key) => /^\d+$/.test(key));
			if (isArray) {
				return keys.reduce((arr, key) => {
					(arr as unknown[])[parseInt(key, 10)] = cleanUp((obj as Record<string, unknown>)[key]);
					return arr;
				}, []);
			}
			return keys.reduce((acc, key) => {
				(acc as Record<string, unknown>)[key] = cleanUp((obj as Record<string, unknown>)[key]);
				return acc;
			}, {});
		}
		return obj;
	}

	return cleanUp(result) as Record<string, unknown> | unknown[];
}
//
// // Example usage:
// let formData = new FormData();
// formData.append("name", "Joanne");
// formData.append("children[1]", "Christina");
//
// console.log(formDataToObject(formData));
//
// formData = new FormData();
// formData.append("name", "Joanne");
// formData.append("pronouns", "she/her");
// formData.append("children[1].pronouns", "she/ella");
//
// console.log(formDataToObject(formData));
//
// formData = new FormData();
// formData.append("[0]", "Joanne");
// formData.append("[1]", "Sara");
//
// console.log(formDataToObject(formData));

/** TODOC */
export function deepSpread(o1: unknown, o2: unknown): unknown {
	if (Array.isArray(o1) && Array.isArray(o2)) {
		return o2.map((item, index) => {
			if (item === null || typeof item === "undefined") {
				return o1[index];
			}
			return deepSpread(o1[index], item);
		});
	} else if (Array.isArray(o1)) {
		return o1.map((item, index) => deepSpread(item, (o2 as unknown[])[index]));
	} else if (o1 !== null && typeof o1 === "object" && o2 !== null && typeof o2 === "object") {
		const result = { ...o1 };
		for (const key in o2) {
			if (key in o2) {
				(result as Record<string, unknown>)[key] = deepSpread((o1 as Record<string, unknown>)[key], (o2 as Record<string, unknown>)[key]);
			}
		}
		return result;
	}
	return typeof o2 === "undefined" ? o1 : o2;
}
//
// // Example usage
// const o1 = {
// 	name: "Christina",
// 	age: 31,
// 	children: [
// 		{
// 			name: "Sara",
// 			pronouns: "she/ella"
// 		},
// 		{
// 			name: "Yngvild",
// 			pronouns: "she/her"
// 		}
// 	]
// };
//
// const o2 = {
// 	pronouns: "she/her",
// 	age: 32,
// 	children: [
// 		undefined,
// 		{
// 			name: "Yngvild",
// 			pronouns: "they/them"
// 		}
// 	]
// };
//
// let result = deepSpread(o1, o2);
// console.log(result);
//
// const arr1 = ["Christina", "Sam"];
// const arr2 = [void 0, "Sara"];
//
// result = deepSpread(arr1, arr2);
// console.log(result);
