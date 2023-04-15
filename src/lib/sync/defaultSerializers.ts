import type { ISyncerOptions } from "$lib/sync/Syncer.js";

export type Serializer<T> = (value: T) => string;
export type Deserializer<T> = (string: string) => T;

/** `SyncerOptions` for plain strings
 * @param serverValue Value to return in `get`method when server rendering */
export function stringSerializer(): [Serializer<string>, Deserializer<string>] {
	return [(str: string) => str, (str: string) => str];
}

/** `SyncerOptions` for numbers
 * @param serverValue Value to return in `get`method when server rendering */
export function numberSerializer(serverValue?: number): ISyncerOptions<number> {
	return { serverValue, deserializer: (str: string) => Number(str), serializer: (num: number) => num.toString() };
}

/** `SyncerOptions` for bigints
 * @param serverValue Value to return in `get`method when server rendering */
export function bigintSerializer(serverValue?: bigint): ISyncerOptions<bigint> {
	return { serverValue, deserializer: (str: string) => BigInt(str), serializer: (int: bigint) => int.toString() };
}

/** `SyncerOptions` for booleans
 * @param serverValue Value to return in `get`method when server rendering */
export function booleanSerializer(serverValue?: boolean): ISyncerOptions<boolean> {
	return { serverValue, deserializer: (str: string) => Boolean(str), serializer: (bool: boolean) => bool.toString() };
}

/** `SyncerOptions` for dates
 * @param serverValue Value to return in `get`method when server rendering */
export function dateSerializer(serverValue?: Date): ISyncerOptions<Date> {
	return { serverValue, deserializer: (str: string) => new Date(str), serializer: (date: Date) => date.toJSON() };
}
