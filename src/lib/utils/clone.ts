import type { Deserializer } from "$lib/utils/unknown.js";
import { deserialize } from "$lib/http/Deserializable.js";

/** Create an entirely new instance of a variable, including objects with objects as properties */
export function cloneViaSerialization<T>(
	deserializer: Deserializer<T> = (something) => JSON.parse(`${something}`) as T,
	something: T,
	serializer: (something: T) => string = (something) => JSON.stringify(something)
): T {
	return deserialize(deserializer, JSON.parse(serializer(something)));
}
