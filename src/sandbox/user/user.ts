import type { Readable, Writable } from "svelte/store";
import { getContext, setContext } from "svelte";

/** TODOC */
export function setUserStore(user: Writable<Record<string, unknown>>): void {
	setContext("user", user);
}

/** TODOC */
export function getUserStore(): Readable<Record<string, unknown>> {
	return getContext<Readable<Record<string, unknown>>>("user");
}
