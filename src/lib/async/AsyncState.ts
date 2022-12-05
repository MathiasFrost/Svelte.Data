/** The result of a `Promise` represented as undefined when pending and value or `Error` when resolved */
export type AsyncState<T> = undefined | Error | T;

/** Tells TypeScript that the AsyncState<T> is currently T (not undefined or Error) if true */
export function stateIsResolved<T>(state: AsyncState<T>): state is T {
	return typeof state !== "undefined" && !(state instanceof Error);
}
