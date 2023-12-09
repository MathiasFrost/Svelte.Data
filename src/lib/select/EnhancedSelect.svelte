<script lang="ts">
	import type { HTMLEnhancedSelect } from "$lib/select/HTMLEnhancedSelect";
	import { onDestroy } from "svelte";
	import { isObject } from "$lib/types";
	import { createEventDispatcher } from "svelte";

	/** TODOC */
	type T = $$Generic;

	/** TODOC */
	type K = $$Generic;

	/** TODOC */
	const dispatch = createEventDispatcher<{ change: HTMLEnhancedSelect<T> }>();

	/** Property name for value */
	export let key = "";

	/** For binding */
	export let value: K | null | undefined = void 0;

	/** For binding */
	export let values: K[] = [];

	/** TODOC */
	export let name = "";

	/** TODOC */
	export let pool: T[] = [];

	/** Do not auto-close */
	export let keepOpen = false;

	/** If keyboard events should be global */
	export let global = false;

	/** Force display text to be valid when blurred */
	export let force = false;

	/** TODOC */
	export const self: HTMLEnhancedSelect<T> = {
		name,
		value: "",
		values: [],
		pool,
		filtered: pool,
		options: [],
		selectedIndex: 0,
		search: {}
	};

	/** TODOC */
	let filtered: T[] = [];

	/** TODOC */
	let options: HTMLElement[] = [];

	/** TODOC */
	let selectedIndex = 0;

	/** TODOC */
	let search: Record<string, HTMLInputElement> = {};

	/** TODOC */
	let hovered = selectedIndex;

	/** TODOC */
	let container: HTMLDivElement | null = null;

	/** TODOC */
	let observer: MutationObserver | null = null;

	/** TODOC */
	let optionContainer: HTMLElement | null = null;

	/** TODOC */
	let scrollBox: HTMLElement | null = null;

	/** Passed as a slot prop for implementation to potentially hide options when not reasonable */
	let focused: boolean = false;

	/** TODOC */
	let open: boolean = false;

	// TODOC
	$: setUpObserver(container);

	// TODOC
	$: updateHighlighted(hovered, options);

	// TODOC
	$: value = (Number(value) || value) as K;

	// TODOC
	$: filtered = getOptions(pool, search);

	// TODOC
	$: updateDisplay(value);

	// Update all references
	$: self.value = `${value}`;
	$: self.values = values.map((value) => `${value}`);
	$: self.search = search;
	$: self.filtered = filtered;
	$: self.pool = pool;
	$: self.options = options;
	$: self.selectedIndex = selectedIndex;
	$: self.name = name;

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
		options = options;

		if (!open) {
			// These need to be set up again when re-rendered
			scrollBox = null;
			optionContainer = null;
			return;
		} else {
			scrollToOptionIfNeeded();
		}

		// Check if selectedIndex is still in range
		const last = options.length - 1;
		if (hovered >= last) {
			// Wrap to closest
			const distanceToZero = Math.abs(hovered);
			const distanceToB = Math.abs(hovered - last);

			if (distanceToZero < distanceToB) hovered = 0;
			else hovered = last;
		}
		selectedIndex = hovered;
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
				if (action === "added" && !options.includes(node)) {
					options.push(node);
					node.addEventListener("mouseover", onMouseover);
					node.addEventListener("click", onClick);
					node.addEventListener("keydown", onKeydown);
					node.setAttribute("tabindex", "-1");
					if (typeof document !== "undefined" && document.activeElement === node) openAndFocus();
					if (!optionContainer && node.parentElement) {
						optionContainer = node.parentElement;
						optionContainer.addEventListener("mouseout", onMouseout);
					}
				} else if (action === "removed" && options.includes(node)) {
					options.splice(options.indexOf(node), 1);
				}
			} else if (node instanceof HTMLInputElement) {
				if (action === "added") {
					node.setAttribute("autocomplete", "off");
					const name = node.name ? node.name : "default";
					search[name] = node;
					updateDisplay(value);
					node.addEventListener("input", onInput);
					node.addEventListener("click", openAndFocus);
					if (typeof document !== "undefined" && document.activeElement === node) openAndFocus();
				} else {
					delete search[name];
				}
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
		hovered = options.indexOf(e.target);
	}

	/** TODOC */
	function onMouseout(): void {
		hovered = selectedIndex;
	}

	/** TODOC */
	function onKeydown(e: KeyboardEvent): void {
		if (!open && e.target instanceof Node && container?.contains(e.target)) {
			if (e.key !== "Enter") open = true;
			if (!["Enter", "Escape"].includes(e.key)) return;
		}
		if (!global && !focused) return;
		switch (e.key) {
			case "ArrowUp":
				e.preventDefault();
				if (hovered <= 0) hovered = options.length - 1;
				else hovered--;
				break;
			case "ArrowDown":
				e.preventDefault();
				if (hovered >= options.length - 1) hovered = 0;
				else hovered++;
				break;
			case "Enter":
				if (!open || e.ctrlKey) return;
				{
					e.preventDefault();
					const item = options[hovered];
					if (item) selectElement(item);
				}
				break;
			case "Escape":
				e.preventDefault();
				clearSearch();
				break;
			default:
				return;
		}

		selectedIndex = hovered;
		scrollToOptionIfNeeded();
	}

	/** TODOC */
	function scrollToOptionIfNeeded(): void {
		const item = options[hovered];
		if (!item || !scrollBox) return;
		const rect = item.getBoundingClientRect();
		const boxRect = scrollBox.getBoundingClientRect();
		// Checking visibility with respect to the scroll position
		const isVisible = rect.top >= boxRect.top && rect.bottom <= boxRect.bottom;

		if (!isVisible) {
			// Determine the correct scroll position
			if (rect.top < boxRect.top) {
				// If the item is above the visible area, scroll to its top
				scrollBox.scrollTo({ behavior: "instant", top: scrollBox.scrollTop + rect.top - boxRect.top });
			} else {
				// If the item is below the visible area, scroll so it's at the bottom
				scrollBox.scrollTo({ behavior: "instant", top: scrollBox.scrollTop + rect.bottom - boxRect.bottom });
			}
		}
	}

	/** TODOC */
	function onInput(): void {
		filtered = getOptions(pool, search);
	}

	/** TODOC */
	function onClick(this: HTMLElement): void {
		selectElement(this);
	}

	/** Called when the decision has been made to select an option */
	function selectElement(e: HTMLElement): void {
		const attributeValue = e.getAttribute("value");
		if (!attributeValue) value = "" as K;
		else value = (Number(attributeValue) || attributeValue) as K;

		hovered = options.indexOf(e);
		selectedIndex = hovered;

		// Update display
		updateDisplay(value);

		const first = Object.keys(search)[0];
		if (search[first]) search[first].focus();
		close();
		dispatch("change", self);
	}

	/** TODOC */
	function clearSearch(): void {
		Object.keys(search).forEach((key) => (search[key].value = ""));
	}

	/** TODOC */
	function updateDisplay(value: K | null | undefined): void {
		if (pool.length && isObject(pool[0])) {
			if (key) {
				const item = pool.find((item) => isObject(item) && `${value}` === `${item[key]}`);
				if (isObject(item)) {
					Object.keys(search).forEach((key) => {
						if (key in search && key in item) {
							const ref = search[key];
							ref.value = `${item[key]}`;
						}
					});
				}
			} else {
				console.warn("EnhancedSelect cannot update display when key is not specified");
			}
		} else {
			const item = pool.find((item) => `${item}` === `${value}`);
			search["default"].setAttribute("value", `${item}`);
		}
	}

	/** TODOC */
	function updateHighlighted(hovered: number, options: HTMLElement[]): void {
		for (let i = 0; i < options.length; ++i) {
			if (i === hovered) options[i].classList.add("highlighted");
			else options[i].classList.remove("highlighted");
		}
	}

	/** TODOC */
	function onBlur(e: FocusEvent): void {
		if (!container) return;
		if (e.relatedTarget instanceof Node) {
			if (container.contains(e.relatedTarget)) return;
		}
		closeAndBlur();
	}

	/** TODOC */
	function onFocus(): void {
		openAndFocus();
	}

	/** TODOC */
	function onWindowClick(e: MouseEvent): void {
		if (!container) return;
		if (e.target instanceof Node && container.contains(e.target)) return;
		close();
	}

	/** TODOC */
	function getOptions(pool: T[], search: Record<string, HTMLInputElement>): T[] {
		return Object.keys(search).reduce<T[]>((prev, curr) => {
			if (curr === "default")
				return prev.filter((item) => {
					const val = search["default"].value.toLowerCase();
					if (!val) return true;
					return JSON.stringify(item).toLowerCase().includes(val);
				});
			else if (pool.length)
				return prev.filter((item) => {
					const val = search[curr].value.toLowerCase();
					if (!val) return true;
					return isObject(item) ? `${item[curr]}`.toLowerCase().includes(val) : `${item}`.toLowerCase().includes(val);
				});
			return prev;
		}, Array.from(pool));
	}

	/** TODOC */
	function closeAndBlur(): void {
		close();
		focused = false;

		// If force, set display
		if (!force) return;
		updateDisplay(value);
	}

	/** TODOC */
	function close(): void {
		if (keepOpen) return;
		open = false;
	}

	/** TODOC */
	function openAndFocus(): void {
		open = true;
		focused = true;
	}
</script>

<svelte:window on:keydown={onKeydown} on:click={onWindowClick} />

<input type="hidden" hidden {name} {value} />
<div style="display: contents;" bind:this={container}>
	{#if observer}
		<slot name="search" {clearSearch} />
		{#if open}
			<slot name="options" options={filtered} />
		{/if}
	{/if}
</div>
