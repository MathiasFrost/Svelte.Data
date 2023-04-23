/** */
export interface ITransformer<T> {
	serialize: (something: T) => string;
	deserialize: (string: string) => T;
}
