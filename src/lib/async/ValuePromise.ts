/** Convenient alias for object containing both value and promise for both mutating and rendering promises */
export type ValuePromise<T> = { value: T; promise: Promise<T> };
