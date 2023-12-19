import { tick } from "svelte";

/** TODOC */
const portalMap = new Map<string, Element>();

/** TODOC */
export function portalDeclared(id: string): boolean {
	return portalMap.has(`$$portal.${id}`);
}

/** Store a reference to an element that will serve as a container for elements teleported to it */
export function portalOut(node: HTMLElement, id = "default") {
	const key = `$$portal.${id}`;
	if (portalMap.has(key)) throw `duplicate portal key "${id}"`;
	else portalMap.set(key, node);
	return { destroy: portalMap.delete.bind(portalMap, key) };
}

/** Mount a new Svelte component */
export function mount(node: HTMLElement, key: string) {
	if (!portalMap.has(key)) throw `unknown portal ${key}`;
	const host = portalMap.get(key);
	host?.insertBefore(node, null as Node | null);
	return () => host?.contains(node) && host.removeChild(node);
}

/** Mount element from Svelte component to it's exit portal container */
export function portalIn(node: HTMLElement, id = "default") {
	let destroy: (() => void) | undefined;
	const key = `$$portal.${id}`;
	if (!portalMap.has(key))
		tick().then(() => {
			destroy = mount(node, key);
		});
	else destroy = mount(node, key);
	return { destroy: () => destroy?.() };
}
