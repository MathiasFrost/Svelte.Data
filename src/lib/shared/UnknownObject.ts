/** An object with unknown properties with unknown value */
export type UnknownObject = {
	[k: string]: unknown;
};

/** Make sure that something is an array (not null) */
export function ensureArray(something: unknown): unknown[] {
	if (!Array.isArray(something)) throw new Error(`Expected array, found ${typeof something}`);
	return something;
}

/** Make sure that something is an object (not null) */
export function ensureObject(something: unknown): UnknownObject {
	if (typeof something !== "object" || something === null) throw new Error(`Expected object, found ${typeof something}`);
	return something as UnknownObject;
}

/** Make sure that something is an object (may be null) */
export function ensureNullableObject(something: unknown): UnknownObject | null {
	if (typeof something !== "object" || something === null) throw new Error(`Expected object or null, found ${typeof something}`);
	return something as UnknownObject | null;
}

/** Make sure that something is a string */
export function ensureString(something: unknown): string {
	if (typeof something !== "string") throw new Error(`Expected string, found ${typeof something}`);
	return something;
}

/** Make sure that something is a number */
export function ensureNumber(something: unknown): number {
	if (typeof something !== "number") throw new Error(`Expected string, found ${typeof something}`);
	return something;
}

/** Make sure that something is a bigint */
export function ensureBigint(something: unknown): bigint {
	if (typeof something !== "bigint") throw new Error(`Expected bigint, found ${typeof something}`);
	return something;
}

/** Make sure that something is a boolean */
export function ensureBoolean(something: unknown): boolean {
	if (typeof something !== "boolean") throw new Error(`Expected boolean, found ${typeof something}`);
	return something;
}

/** Make sure that something is a valid Date parsable string */
export function ensureDateString(something: unknown): Date {
	if (typeof something !== "string") throw new Error(`Expected Date parsable string, found ${typeof something}`);
	const date = new Date(something);
	if (date.getTime() !== date.getTime()) throw new Error(`Expected Date parsable string, found ${something}`);
	return date;
}

/** Tells TypeScript that something is an unknown object */
export function isObject(something: unknown): something is UnknownObject {
	return typeof something === "object" || something !== null;
}

/** Tells TypeScript that something is an unknown object or null */
export function isNullableObject(something: unknown): something is UnknownObject | null {
	return typeof something === "object";
}
