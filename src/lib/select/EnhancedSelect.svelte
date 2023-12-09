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
	export let name = "";

	/** TODOC */
	export let pool: T[] = [];

	/** TODOC */
	export const self: HTMLEnhancedSelect<T> = {
		name,
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
	let scrollBox: HTMLElement | null = null;

	/** When any of the elements pertaining to the EnhancedSelect is in focus */
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
		// Check if the node is an Element and has a 'value' attribute; these are options
		if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
			node.addEventListener("blur", onBlur);
			node.addEventListener("focus", onFocus);

			// Check if element is scroll box
			if (!scrollBox) {
				const style = window.getComputedStyle(node);
				const canScroll = (overflow: string) => ["auto", "scroll"].includes(overflow);
				if (canScroll(style.overflow) || canScroll(style.overflowX) || canScroll(style.overflowY)) scrollBox = node;
			}

			if (node.hasAttribute("value")) {
				if (action === "added" && !self.options.includes(node)) {
					self.options.push(node);
					node.addEventListener("mouseover", onMouseover);
					node.addEventListener("click", onClick);
					node.addEventListener("keydown", onKeydown);
					if (typeof document !== "undefined" && document.activeElement === node) focused = true;
					if (!optionContainer && node.parentElement) {
						optionContainer = node.parentElement;
						optionContainer.addEventListener("mouseout", onMouseout);
					}
				} else if (action === "removed" && self.options.includes(node)) {
					self.options.splice(self.options.indexOf(node), 1);
				}
			} else if (node instanceof HTMLInputElement) {
				node.setAttribute("autocomplete", "off");
				node.addEventListener("input", onInput);
				if (typeof document !== "undefined" && document.activeElement === node) focused = true;
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
		if (!focused) return;
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

		// Check if element is in view
		const item = self.options[hovered];
		if (!item || !scrollBox) return;
		const rect = item.getBoundingClientRect();
		const boxRect = scrollBox.getBoundingClientRect();
		const isVisible = rect.top >= boxRect.top && rect.bottom <= boxRect.top + boxRect.height;

		if (!isVisible) {
			item.scrollIntoView({ behavior: "instant" });
		}
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
	function onBlur(e: Event): void {
		if (!container) return;
		if ("relatedTarget" in e && e.relatedTarget instanceof Node) {
			if (container.contains(e.relatedTarget)) return;
		} else if ("explicitOriginalTarget" in e && e.explicitOriginalTarget instanceof Node) {
			if (e.explicitOriginalTarget !== e.target && container.contains(e.explicitOriginalTarget)) return;
		} else {
			return;
		}
		focused = false;
	}

	/** TODOC */
	function onFocus(): void {
		focused = true;
	}

	/** TODOC */
	function onWindowClick(e: MouseEvent): void {
		if (!container) return;
		if (e.target instanceof Node && container.contains(e.target)) return;
		focused = false;
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

<svelte:window on:keydown={onKeydown} on:click={onWindowClick} />

<div style="display: contents;" bind:this={container}>
	{#if observer}
		<slot name="search" />
		<slot name="options" options={self.filtered} {focused} />
	{/if}
</div>
