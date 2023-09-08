/** TODOC */
export interface Transformer<T> {
	serialize: (something: T) => string;
	deserialize: (string: string) => T;
}
