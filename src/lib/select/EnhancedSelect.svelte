<script lang="ts">
	import type { HTMLEnhancedSelect } from "$lib/select/HTMLEnhancedSelect";
	import { onDestroy } from "svelte";
	import { isObject } from "$lib/types";

	/** TODOC */
	type T = $$Generic;

	/** TODOC */
	type K = $$Generic;

	/** TODOC */
	export let pool: T[] = [];

	/** TODOC */
	export const self: HTMLEnhancedSelect<T, K> = {
		value: null,
		values: [],
		pool,
		filtered: pool,
		options: [],
		selectedIndex: 0,
		search: { default: "" }
	};

	/** TODOC */
	let hovered = self.selectedIndex;

	/** TODOC */
	let container: HTMLDivElement | null = null;

	/** TODOC */
	let observer: MutationObserver | null = null;

	/** TODOC */
	let optionContainer: HTMLElement | null = null;

	// TODOC
	$: setUpObserver(container);

	// TODOC
	$: updateHighlighted(hovered, self.options);

	// TODOC
	$: self.filtered = getOptions(self.pool, self.search);

	// TODOC
	onDestroy(() => observer?.disconnect());

	/** TODOC */
	function setUpObserver(container: HTMLDivElement | null): void {
		if (!container || observer) return;
		observer = new MutationObserver(mutationCallback);
		observer.observe(container, { attributes: false, childList: true, subtree: false });
	}

	/** TODOC */
	function mutationCallback(mutationsList: MutationRecord[]): void {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach(searchForValueAttribute);
			}
		}
		self.options = self.options;
	}

	/** TODOC */
	function searchForValueAttribute(node: Node) {
		// Check if the node is an Element and has a 'value' attribute
		if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
			if (node.hasAttribute("value")) {
				if (!self.options.includes(node)) {
					self.options.push(node);
					node.addEventListener("mouseover", onMouseover);
					if (!optionContainer && node.parentElement) {
						optionContainer = node.parentElement;
						optionContainer.addEventListener("mouseout", onMouseout);
					}
				}
			} else if (node instanceof HTMLInputElement) {
				node.addEventListener("input", onInput);
			}
		}

		// If the node has child nodes, recursively search them
		if (node.hasChildNodes()) {
			node.childNodes.forEach(searchForValueAttribute);
		}
	}

	/** TODOC */
	function onMouseover(e: Event): void {
		if (!(e.target instanceof HTMLElement)) return;
		hovered = self.options.indexOf(e.target);
	}

	/** TODOC */
	function onMouseout(): void {
		hovered = self.selectedIndex;
	}

	/** TODOC */
	function onKeydown(e: KeyboardEvent): void {
		switch (e.key) {
			case "ArrowUp":
				e.preventDefault();
				if (hovered <= 0) hovered = self.options.length - 1;
				else hovered--;
				break;
			case "ArrowDown":
				e.preventDefault();
				if (hovered >= self.options.length - 1) hovered = 0;
				else hovered++;
				break;
		}
		self.selectedIndex = hovered;
	}

	/** TODOC */
	function onInput(this: HTMLInputElement): void {
		const name = this.name ? this.name : "default";
		self.search[name] = this.value;
	}

	/** TODOC */
	function updateHighlighted(hovered: number, options: HTMLElement[]): void {
		for (let i = 0; i < options.length; ++i) {
			if (i === hovered) options[i].classList.add("highlighted");
			else options[i].classList.remove("highlighted");
		}
	}

	/** TODOC */
	function getOptions(pool: T[], search: Record<string, string>): T[] {
		return Object.keys(search).reduce<T[]>((prev, curr) => {
			if (curr === "default")
				return prev.filter((item) => {
					const val = search["default"].toLowerCase();
					if (!val) return true;
					return JSON.stringify(item).toLowerCase().includes(val);
				});
			else if (pool.length)
				return prev.filter((item) => {
					const val = search[curr].toLowerCase();
					if (!val) return true;
					return isObject(item) ? `${item[curr]}`.toLowerCase().includes(val) : `${item}`.toLowerCase().includes(val);
				});
			return prev;
		}, Array.from(pool));
	}
</script>

<svelte:window on:keydown={onKeydown} />

<div style="display: contents;" bind:this={container}>
	{#if observer}
		<slot name="search" />
		<slot name="options" options={self.filtered} />
	{/if}
</div>
