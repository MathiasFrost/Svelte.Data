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

export function deserialize<TResult>(ctor: new (...args: never[]) => TResult, o: unknown): TResult {
	if (o === null || typeof o !== "object") throw new Error("Could not deserialize JSON");
	if (!Reflect.has(ctor, "deserialize")) return { ...o } as TResult;

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	return ctor.deserialize(o);
}
