<script lang="ts">
	import type { HTMLEnhancedSelect } from "$lib/select/HTMLEnhancedSelect";
	import { onDestroy } from "svelte";
	import { isObject } from "$lib/types";

	/** TODOC */
	type T = $$Generic;

	/** TODOC */
	type K = $$Generic;

	/** For binding */
	export let value: K | null | undefined = void 0;

	/** TODOC */
	export let pool: T[] = [];

	/** TODOC */
	export const self: HTMLEnhancedSelect<T> = {
		value: "",
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

	/** TODOC */
	let focused: boolean = false;

	// TODOC
	$: setUpObserver(container);

	// TODOC
	$: updateHighlighted(hovered, self.options);

	// TODOC
	$: value = (Number(self.value) || self.value) as K;

	// TODOC
	$: self.filtered = getOptions(self.pool, self.search);

	// TODOC
	onDestroy(() => {
		observer?.disconnect();
	});

	/** TODOC */
	function setUpObserver(container: HTMLDivElement | null): void {
		if (!container || observer) return;
		observer = new MutationObserver(mutationCallback);
		observer.observe(container, { attributes: false, childList: true, subtree: true });
	}

	/** TODOC */
	function mutationCallback(mutationsList: MutationRecord[]): void {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => searchForValueAttribute(node, "added"));
				mutation.removedNodes.forEach((node) => searchForValueAttribute(node, "removed"));
			}
		}
		self.options = self.options;
	}

	/** TODOC */
	function searchForValueAttribute(node: Node, action: "removed" | "added") {
		// Check if the node is an Element and has a 'value' attribute
		if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
			if (node.hasAttribute("value")) {
				if (action === "added" && !self.options.includes(node)) {
					self.options.push(node);
					node.addEventListener("mouseover", onMouseover);
					node.addEventListener("click", onClick);
					node.addEventListener("keydown", onKeydown);
					if (!optionContainer && node.parentElement) {
						optionContainer = node.parentElement;
						optionContainer.addEventListener("mouseout", onMouseout);
					}
				} else if (action === "removed" && self.options.includes(node)) {
					self.options.splice(self.options.indexOf(node), 1);
				}
			} else if (node instanceof HTMLInputElement) {
				node.addEventListener("input", onInput);
			}
		}

		// If the node has child nodes, recursively search them
		if (node.hasChildNodes()) {
			node.childNodes.forEach((node) => searchForValueAttribute(node, action));
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
			case "Enter":
				{
					e.preventDefault();
					const item = self.options[hovered];
					if (item) selectElement(item);
				}
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
	function onClick(this: HTMLElement): void {
		selectElement(this);
	}

	/** TODOC */
	function selectElement(e: HTMLElement): void {
		const value = e.getAttribute("value");
		if (!value) self.value = "";
		else self.value = value;
		hovered = self.options.indexOf(e);
		self.selectedIndex = hovered;
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
