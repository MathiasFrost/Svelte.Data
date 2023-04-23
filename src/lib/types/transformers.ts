import type { ITransformer } from "./ITransformer.js";

/** */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function anyTransformer(): ITransformer<any> {
	return {
		deserialize(string) {
			return JSON.parse(string);
		},
		serialize(something) {
			return JSON.stringify(something);
		}
	};
}

/** */
export function stringTransformer(): ITransformer<string> {
	return {
		deserialize(string) {
			return string;
		},
		serialize(something) {
			return something;
		}
	};
}
