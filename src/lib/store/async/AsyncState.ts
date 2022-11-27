/** Is undefined when pending */
export type AsyncState<T> = undefined | Error | T;

/** Tells TypeScript that the AsyncState<T> is currently T (not undefined or Error) if true */
export function isValue<T>(state: AsyncState<T>): state is T {
	return typeof state !== "undefined" && !(state instanceof Error);
}
