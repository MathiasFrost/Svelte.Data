/** Is undefined when pending */
export type AsyncState<T> = undefined | Error | T;

/** */
export function isPendingOrError<T>(state: AsyncState<T>): boolean {
	return typeof state === "undefined" || state instanceof Error;
}
