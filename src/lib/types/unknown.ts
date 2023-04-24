import type { UnknownObject } from "./UnknownObject.js";

/** Make sure that something is an array (not null) */
export function ensureArray(something: unknown): unknown[] {
	if (Array.isArray(something)) return something;
	throw new Error(`Expected Array, found ${typeof something}`);
}

/** Make sure that something is an array (may be null) */
export function ensureArrayNullable(something: unknown): unknown[] | null {
	if (something === null || Array.isArray(something)) return something;
	throw new Error(`Expected Array | null, found ${typeof something}`);
}

/** Make sure that something is an object (not null) */
export function ensureObject(something: unknown): UnknownObject {
	if (something !== null && typeof something === "object") return something as UnknownObject;
	throw new Error(`Expected object, found ${typeof something}`);
}

/** Make sure that something is an object (may be null) */
export function ensureObjectNullable(something: unknown): UnknownObject | null {
	if (typeof something === "object") return something as UnknownObject | null;
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

/** Make sure that something is a valid Date parsable string (not null) */
export function ensureDateString(something: unknown): Date {
	if (typeof something !== "string") throw new Error(`Expected Date parsable string, found ${typeof something}`);
	const date = new Date(something);
	if (date.getTime() !== date.getTime()) throw new Error(`Expected Date parsable string, found ${something}`);
	return date;
}

/** Make sure that something is a valid Date parsable string (may be null) */
export function ensureDateStringNullable(something: unknown): Date | null {
	if (something === null) return something;
	if (typeof something !== "string") throw new Error(`Expected Date parsable string, found ${typeof something}`);
	const date = new Date(something);
	if (date.getTime() !== date.getTime()) throw new Error(`Expected Date parsable string, found ${something}`);
	return date;
}

/** Make sure that something is a Boolean parsable string (not null) */
export function ensureBooleanString(something: unknown): boolean {
	if (typeof something !== "string") throw new Error(`Expected Boolean parsable string, found ${typeof something}`);
	if (something === "true") return true;
	if (something === "false") return false;
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
export function ensureInstanceOf<T>(something: unknown, t: Function): T {
	if (something instanceof t) return something as T;
	throw new Error(`Expected an instance of ${t.name}, found ${typeof something}`);
}

/** Make sure that something is an instance of something */
// eslint-disable-next-line @typescript-eslint/ban-types
export function ensureInstanceOfNullable<T>(something: unknown, t: Function): T | null {
	if (something === null) return null;
	if (something instanceof t) return something as T;
	throw new Error(`Expected an instance of ${t.name}, found ${typeof something}`);
}

/** Tells TypeScript that something is an unknown object (not null) */
export function isObject(something: unknown): something is UnknownObject {
	return something !== null && typeof something === "object";
}

/** Tells TypeScript that something is an unknown object (may be null) */
export function isObjectNullable(something: unknown): something is UnknownObject | null {
	return typeof something === "object";
}
