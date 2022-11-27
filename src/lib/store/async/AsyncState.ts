/** Is undefined when pending */
export type AsyncState<T> = undefined | Error | T;

/** */
export function isValue<T>(state: AsyncState<T>): state is T {
	return typeof state !== "undefined" && !(state instanceof Error);
}
