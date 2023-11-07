import { getContext, setContext } from "svelte";

/** TODOC */
export function setTypedContext<T>(type: new () => T): void {
	setContext<T>(type.prototype.name, new type());
}

/** TODOC */
export function getTypedContext<T>(type: new () => T): T {
	return getContext<T>(type.prototype.name);
}
