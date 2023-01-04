import type { SyncerOptions } from "$lib/sync/Syncer.js";

/** `SyncerOptions` for plain strings
 * @param serverValue Value to return in `get`method when server rendering */
export function stringSerializer(serverValue?: string): SyncerOptions<string> {
	return { serverValue, deserializer: (str: string) => str, serializer: (str: string) => str };
}

/** `SyncerOptions` for numbers
 * @param serverValue Value to return in `get`method when server rendering */
export function numberSerializer(serverValue?: number): SyncerOptions<number> {
	return { serverValue, deserializer: (str: string) => Number(str), serializer: (num: number) => num.toString() };
}

/** `SyncerOptions` for bigints
 * @param serverValue Value to return in `get`method when server rendering */
export function bigintSerializer(serverValue?: bigint): SyncerOptions<bigint> {
	return { serverValue, deserializer: (str: string) => BigInt(str), serializer: (int: bigint) => int.toString() };
}

/** `SyncerOptions` for booleans
 * @param serverValue Value to return in `get`method when server rendering */
export function booleanSerializer(serverValue?: boolean): SyncerOptions<boolean> {
	return { serverValue, deserializer: (str: string) => Boolean(str), serializer: (bool: boolean) => bool.toString() };
}

/** `SyncerOptions` for dates
 * @param serverValue Value to return in `get`method when server rendering */
export function dateSerializer(serverValue?: Date): SyncerOptions<Date> {
	return { serverValue, deserializer: (str: string) => new Date(str), serializer: (date: Date) => date.toJSON() };
}
