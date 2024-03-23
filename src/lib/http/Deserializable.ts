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
			switch (typeCodes[key]) {
				case TypeCode.string:
					if (typeof input[key] !== "string") {
						expected = "string";
					}
					break;
				case TypeCode.number:
					if (typeof input[key] !== "number") {
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

			Reflect.set(res, key, input[key]);
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
