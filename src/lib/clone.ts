/** Create an entirely new instance of a variable, including objects with objects as properties */
export function cloneViaSerialization<T>(
	something: T,
	serialize: (something: T) => string = (something) => JSON.stringify(something),
	deserialize: (string: string) => T = (string) => JSON.parse(string)
): T {
	return deserialize(serialize(something));
}
