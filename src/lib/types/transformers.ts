import type { Transformer } from "$lib/types/Transformer.js";
import { ensureBoolean, ensureDateString, ensureNumber, ensureString } from "$lib/types/unknown.js";

/** TODOC */
export function jsonTransformer<T>(deserializer?: (string: string) => T): Transformer<T> {
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
export function stringTransformer(deserializer?: (string: string) => string): Transformer<string> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : ensureString(string);
		},
		serialize(something) {
			return something;
		}
	};
}

/** TODOC */
export function numberTransformer(deserializer?: (string: string) => number): Transformer<number> {
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
export function booleanTransformer(deserializer?: (string: string) => boolean): Transformer<boolean> {
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
export function dateTransformer(deserializer?: (string: string) => Date): Transformer<Date> {
	return {
		deserialize(string) {
			return typeof deserializer !== "undefined" ? deserializer(string) : ensureDateString(string);
		},
		serialize(something) {
			return something.toISOString();
		}
	};
}
