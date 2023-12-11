import { tick } from "svelte";

/** TODOC */
const portal_map = new Map();

/** TODOC */
export function portalDeclared(id: string): boolean {
	return portal_map.has(id);
}

/** Store a reference to an element that will serve as a container for elements teleported to it */
export function portalOut(node: HTMLElement, id = "default") {
	const key = `$$portal.${id}`;
	if (portal_map.has(key)) throw `duplicate portal key "${id}"`;
	else portal_map.set(key, node);
	return { destroy: portal_map.delete.bind(portal_map, key) };
}

/** Mount a new Svelte component */
function mount(node: HTMLElement, key: string) {
	if (!portal_map.has(key)) throw `unknown portal ${key}`;
	const host = portal_map.get(key);
	host.insertBefore(node, null as Node | null);
	return () => host.contains(node) && host.removeChild(node);
}

/** Mount element from Svelte component to it's exit portal container */
export function portalIn(node: HTMLElement, id = "default") {
	let destroy: (() => void) | undefined;
	const key = `$$portal.${id}`;
	if (!portal_map.has(key))
		tick().then(() => {
			destroy = mount(node, key);
		});
	else destroy = mount(node, key);
	return { destroy: () => destroy?.() };
}
