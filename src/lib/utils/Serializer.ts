// noinspection JSUnusedGlobalSymbols

import { ensureBoolean, ensureDateOnlyString, ensureDateString, ensureNumber, ensureType } from "$lib/utils/unknown.js";
import type { DateOnly, DateWrap } from "$lib/date/DateOnly.js";

/** TODOC */
export interface Serializer<T> {
	/** TODOC */
	serialize: (something: T) => string;

	/** TODOC */
	deserialize: (string: string) => T;
}

/** TODOC */
export function jsonSerializer<T>(deserializer?: (string: string) => T): Serializer<T> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : JSON.parse(string);
		},
		serialize(something) {
			return JSON.stringify(something);
		}
	};
}

/** TODOC */
export function stringSerializer(deserializer?: (string: string) => string): Serializer<string> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : string;
		},
		serialize(something) {
			return something;
		}
	};
}

/** TODOC */
export function typeSerializer<T>(values: T[], deserializer?: (string: string) => T): Serializer<T> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : ensureType<T>(string, values);
		},
		serialize(something) {
			return `${something}`;
		}
	};
}

/** TODOC */
export function numberSerializer(deserializer?: (string: string) => number): Serializer<number> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : ensureNumber(string);
		},
		serialize(something) {
			return something.toString();
		}
	};
}

/** TODOC */
export function booleanSerializer(deserializer?: (string: string) => boolean): Serializer<boolean> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : ensureBoolean(string);
		},
		serialize(something) {
			return something.toString();
		}
	};
}

/** TODOC */
export function dateSerializer(deserializer?: (string: string) => Date): Serializer<Date> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : ensureDateString(string);
		},
		serialize(something) {
			return something.toISOString();
		}
	};
}

/** TODOC */
export function dateOnlySerializer(wrap: DateWrap, deserializer?: (string: string) => DateOnly): Serializer<DateOnly> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : ensureDateOnlyString(string, wrap);
		},
		serialize(something) {
			return something.toISOString();
		}
	};
}
