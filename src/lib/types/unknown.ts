import { DateOnly, DateWrap } from "$lib/date/DateOnly.js";
import { deserialize } from "$lib/http/Deserializable.js";

/** Either a constructor or a function that takes in an unknown and outputs T definitively */
export type Deserializer<T> = (new (...args: never[]) => T) | ((something: unknown) => T) | { deserialize: (something: unknown) => T };

/** Make sure that something is an array (not null) */
export function ensureArray<T = unknown>(something: unknown, deserializer?: Deserializer<T>): T[] {
	if (Array.isArray(something)) {
		if (typeof deserializer !== "undefined") return something.map((value) => deserialize(deserializer, value));
		return something;
	}
	throw new Error(`Expected Array, found ${typeof something}`);
}

/** Make sure that something is an array (may be null) */
export function ensureArrayNullable<T = unknown>(something: unknown, ctor?: Deserializer<T>): T[] | null {
	if (something === null || Array.isArray(something)) {
		if (typeof ctor !== "undefined" && something !== null) return something.map((value) => deserialize(ctor, value));
		return something;
	}
	throw new Error(`Expected Array | null, found ${typeof something}`);
}

/** Make sure that something is an object (not null) */
export function ensureObject<T = Record<string, unknown>>(something: unknown, ctor?: Deserializer<T>): T {
	if (typeof something === "object" && something !== null) {
		if (typeof ctor !== "undefined") return deserialize(ctor, something);
		return something as T;
	}
	throw new Error(`Expected object, found ${typeof something}`);
}

/** Make sure that something is an object (may be null) */
export function ensureObjectNullable<T = Record<string, unknown>>(something: unknown, ctor?: Deserializer<T>): T | null {
	if (typeof something === "object") {
		if (typeof ctor !== "undefined" && something !== null) return deserialize(ctor, something);
		return something as T | null;
	}
	throw new Error(`Expected object | null, found ${typeof something}`);
}

/** Make sure that something is a string (not null) */
export function ensureString(something: unknown): string {
	if (typeof something === "string") return something;
	throw new Error(`Expected string, found ${typeof something}`);
}

/** Make sure that something is a string (may be null) */
export function ensureStringNullable(something: unknown): string | null {
	if (something === null || typeof something === "string") return something;
	throw new Error(`Expected string | null, found ${typeof something}`);
}

/** Make sure that something is among the allowed values */
export function ensureType<T>(something: unknown, values: T[]): T {
	if (values.includes(something as T)) return something as T;
	throw new Error(`Expected something among ${values.join(", ")}, found ${something}`);
}

/** Make sure that something is among the allowed values */
export function ensureTypeNullable<T>(something: unknown, values: T[]): T | null {
	if (something === null || values.includes(something as T)) return something as T | null;
	throw new Error(`Expected something among ${values.join(", ")} | null, found ${something}`);
}

/** Make sure that something is a number (not null) */
export function ensureNumber(something: unknown): number {
	if (typeof something === "number") return something;
	throw new Error(`Expected number, found ${typeof something}`);
}

/** Make sure that something is a number (may be null) */
export function ensureNumberNullable(something: unknown): number | null {
	if (something === null || typeof something === "number") return something;
	throw new Error(`Expected number | null, found ${typeof something}`);
}

/** Make sure that something is a bigint (not null) */
export function ensureBigint(something: unknown): bigint {
	if (typeof something === "bigint") return something;
	throw new Error(`Expected bigint, found ${typeof something}`);
}

/** Make sure that something is a bigint (may be null) */
export function ensureBigintNullable(something: unknown): bigint | null {
	if (something === null || typeof something === "bigint") return something;
	throw new Error(`Expected bigint | null, found ${typeof something}`);
}

/** Make sure that something is a boolean (not null) */
export function ensureBoolean(something: unknown): boolean {
	if (typeof something === "boolean") return something;
	throw new Error(`Expected boolean, found ${typeof something}`);
}

/** Make sure that something is a boolean (may be null) */
export function ensureBooleanNullable(something: unknown): boolean | null {
	if (something === null || typeof something === "boolean") return something;
	throw new Error(`Expected boolean | null, found ${typeof something}`);
}

/** TODOC */
export function stripQuotes(string: string): string {
	if (string.startsWith('"') && string.endsWith('"')) return string.substring(1, string.length - 1);
	return string;
}

/** Make sure that something is a valid Date parsable string (not null) */
export function ensureDateString(something: unknown): Date {
	if (typeof something !== "string") throw new Error(`Expected Date parsable string, found ${typeof something}`);
	const date = new Date(stripQuotes(something));
	if (date.getTime() !== date.getTime()) throw new Error(`Expected Date parsable string, found ${something}`);
	return date;
}

/** Make sure that something is a valid Date parsable string (may be null) */
export function ensureDateStringNullable(something: unknown): Date | null {
	if (something === null) return something;
	if (typeof something !== "string") throw new Error(`Expected Date parsable string, found ${typeof something}`);
	const date = new Date(stripQuotes(something));
	if (date.getTime() !== date.getTime()) throw new Error(`Expected Date parsable string, found ${something}`);
	return date;
}

/** Make sure that something is a valid DateOnly parsable string (not null) */
export function ensureDateOnlyString(something: unknown, wrap: DateWrap, roundTripped?: boolean): DateOnly {
	if (typeof something !== "string") throw new Error(`Expected DateOnly parsable string, found ${typeof something}`);
	const date = new DateOnly(stripQuotes(something), wrap, roundTripped);
	if (date.getTime() !== date.getTime()) throw new Error(`Expected DateOnly parsable string, found ${something}`);
	return date;
}

/** Make sure that something is a valid DateOnly parsable string (may be null) */
export function ensureDateOnlyStringNullable(something: unknown, wrap: DateWrap, roundTripped?: boolean): DateOnly | null {
	if (something === null) return something;
	if (typeof something !== "string") throw new Error(`Expected DateOnly parsable string, found ${typeof something}`);
	const date = new DateOnly(stripQuotes(something), wrap, roundTripped);
	if (date.getTime() !== date.getTime()) throw new Error(`Expected DateOnly parsable string, found ${something}`);
	return date;
}

/** Make sure that something is a Boolean parsable string (not null) */
export function ensureBooleanString(something: unknown): boolean {
	if (typeof something !== "string") throw new Error(`Expected Boolean parsable string, found ${typeof something}`);
	if (something.toLowerCase() === "true") return true;
	if (something.toLowerCase() === "false") return false;
	throw new Error(`Expected Boolean parsable string, found ${typeof something}`);
}

/** Make sure that something is a BigInt parsable string (not null) */
export function ensureBigIntString(something: unknown): bigint {
	if (typeof something !== "string") throw new Error(`Expected BigInt parsable string, found ${typeof something}`);
	if (!something) throw new Error(`Expected BigInt parsable string, found ${typeof something}`);
	return BigInt(something);
}

/** Make sure that something is a Number parsable string (not null) */
export function ensureNumberString(something: unknown): number {
	if (typeof something !== "string") throw new Error(`Expected Number parsable string, found ${typeof something}`);
	const number = Number(something);
	if (!something || isNaN(number)) throw new Error(`Expected Number parsable string, found ${typeof something}`);
	return number;
}

/** Make sure that something is an instance of something */
// eslint-disable-next-line @typescript-eslint/ban-types
export function ensureInstanceOf<T>(something: unknown, t: new (...args: never[]) => T): T {
	if (something instanceof t) return something as T;
	throw new Error(`Expected an instance of ${t.name}, found ${typeof something}`);
}

/** Make sure that something is an instance of something */
export function ensureInstanceOfNullable<T>(something: unknown, t: new (...args: never[]) => T): T | null {
	if (something === null) return null;
	if (something instanceof t) return something as T;
	throw new Error(`Expected an instance of ${t.name}, found ${typeof something}`);
}

/** Make sure that each key of a dictionary is of type */
export function ensureDictionary<T>(something: unknown, deserializer: Deserializer<T>): Record<string, T> {
	const res: Record<string, T> = {};
	const o = ensureObject(something);
	for (const key of Object.keys(o)) {
		res[key] = deserialize(deserializer, o[key]);
	}
	return res;
}

/** Make sure that each key of a dictionary is of type */
export function ensureDictionaryNullable<T>(something: unknown, deserializer: Deserializer<T>): Record<string, T> | null {
	if (something === null) return null;
	return ensureDictionary(something, deserializer);
}

/** Tells TypeScript that something is an unknown object (not null) */
export function isObject(something: unknown): something is Record<string, unknown> {
	return something !== null && typeof something === "object";
}

/** Tells TypeScript that something is an unknown object (may be null) */
export function isObjectNullable(something: unknown): something is Record<string, unknown> | null {
	return typeof something === "object";
}
