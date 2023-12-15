<script lang="ts">
	import type { HTMLEnhancedSelectElement } from "$lib/select/HTMLEnhancedSelectElement.js";
	import { createEventDispatcher, onDestroy, tick } from "svelte";
	import { isObject } from "$lib/types";
	import type { HTMLEnhancedOptionElement } from "$lib/select/HTMLEnhancedOptionElement.js";

	/** TODOC */
	type T = $$Generic;

	// /** TODOC */
	// type K = $$Generic;

	/** TODOC */
	const DEFAULT_NAME = "[DEFAULT]";

	/** TODOC */
	const dispatch = createEventDispatcher<{ change: HTMLEnhancedSelectElement<T> }>();

	/** For binding */
	export let value: unknown | null = null;

	/** For binding */
	export let values: (unknown | null)[] = [];

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

	/** Multiple or single select */
	export let multiple = false;

	/** Element to focus after closing */
	export let reFocus: HTMLElement | null = null;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** TODOC */
	export const self: HTMLEnhancedSelectElement<T> = {
		name,
		value: null,
		values: [],
		pool,
		filtered: pool,
		options: [],
		selectedIndex: 0,
		search: {},
		focus() {
			reFocus?.blur();
			openAndFocus();
		},
		close() {
			close();
		}
	};

	/** When the EnhancedSelect expects the container to be open if gated behind an `#if`-block */
	let open: boolean;

	/** TODOC */
	let filtered: T[] = [];

	/** TODOC */
	let options: HTMLEnhancedOptionElement<T>[] = [];

	/** TODOC */
	let selectedIndex = 0;

	/** TODOC */
	let search: Record<string, HTMLInputElement> = {};

	/** TODOC */
	let searchValues: Record<string, string> = {};

	/** TODOC */
	let filterOptions: (options: T[]) => T[] = getFilterOptions(searchValues);

	/** TODOC */
	let hovered = selectedIndex;

	/** TODOC */
	let container: HTMLDivElement | null = null;

	/** TODOC */
	let observer: MutationObserver | null = null;

	/** TODOC */
	let lastFocused: HTMLElement | null = null;

	/** TODOC */
	let optionContainer: HTMLElement | null = null;

	/** TODOC */
	let scrollBox: HTMLElement | null = null;

	/** Passed as a slot prop for implementation to potentially hide options when not reasonable */
	let focused: boolean = false;

	// TODOC
	$: setUpObserver(container);

	// TODOC
	$: updateHighlighted(hovered, options);

	// Update display when value changes
	$: updateDisplay(value);

	// Update all references
	$: self.value = value;
	$: self.values = values;
	$: self.search = search;
	$: self.options = options;
	$: self.pool = pool;
	$: self.filtered = filtered;
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
				mutation.addedNodes.forEach((node) => searchForOptions(node, "added"));
				mutation.removedNodes.forEach((node) => searchForOptions(node, "removed"));
			}
		}
		options = options;

		if (open) scrollToOptionIfNeeded();
	}

	/** TODOC */
	function searchForOptions(node: Node, action: "removed" | "added") {
		// Check if the node is an Element and has a 'value' attribute; these are options
		if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
			// Check if element is scroll box
			if (!scrollBox) {
				const style = window.getComputedStyle(node);
				const canScroll = (overflow: string) => ["auto", "scroll"].includes(overflow);
				if (canScroll(style.overflow) || canScroll(style.overflowX) || canScroll(style.overflowY)) {
					node.setAttribute("tabindex", "-1");
					scrollBox = node;
				}
			} else if (action === "removed" && scrollBox === node) {
				scrollBox = null;
			}
			if (action === "removed" && scrollBox === optionContainer) optionContainer = null;

			if (
				node instanceof HTMLInputElement &&
				!node.hasAttribute("readonly") &&
				!node.getAttribute("readonly") &&
				!node.hasAttribute("disabled") &&
				!node.getAttribute("disabled") &&
				["text", "search"].includes(`${node.getAttribute("type")}`)
			) {
				if (action === "added") {
					node.setAttribute("autocomplete", "off");
					const name = node.name ? node.name : DEFAULT_NAME;
					search[name] = node;
					searchValues[name] = node.value;
					updateDisplay(value); // Update display when the input is rendered
					node.addEventListener("input", onInput);
					node.addEventListener("click", openAndFocus);
					node.addEventListener("blur", onBlur);
					node.addEventListener("focus", onFocus);
					if (typeof document !== "undefined" && document.activeElement === node) openAndFocus();
				} else {
					delete search[name];
					delete searchValues[name];
				}
			}
		}

		// If the node has child nodes, recursively search them
		if (node.hasChildNodes()) {
			node.childNodes.forEach((node) => searchForOptions(node, action));
		}
	}

	/** TODOC */
	function onKeydown(e: KeyboardEvent): void {
		if (!focused) return;
		if ((!open && e.key === "Enter") || (e.key === "Enter" && e.ctrlKey)) {
			close();
			return;
		}
		switch (e.key) {
			case "ArrowUp":
				e.preventDefault();
				if (hovered <= 0) return;
				hovered--;
				break;
			case "ArrowDown":
				e.preventDefault();
				if (hovered >= options.filter((o) => !!o.element).length - 1) return;
				hovered++;
				break;
			case "Enter":
				{
					e.preventDefault();
					if (multiple) return;
					const item = options[hovered];
					if (item) selectElement(item);
				}
				break;
			case " ":
				{
					if (!multiple || !e.ctrlKey) return;
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

		open = true;
		selectedIndex = hovered;
		scrollToOptionIfNeeded();
	}

	/** TODOC */
	function scrollToOptionIfNeeded(): void {
		const item = options[hovered];
		if (!item || !scrollBox || !item.element) return;
		const rect = item.element.getBoundingClientRect();
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
	function onInput(this: HTMLInputElement): void {
		const name = this.getAttribute("name")?.toString();
		if (name) searchValues[name] = this.value;
		else searchValues[DEFAULT_NAME] = this.value;
		filterOptions = getFilterOptions(searchValues);
	}

	/** Called when the decision has been made to select an option */
	function selectElement(e: HTMLEnhancedOptionElement<T>): void {
		if (multiple) {
			if (e.togglesAll) {
				const allChecked = options.every((o) => o.checked);
				if (allChecked) values = [];
				else values = options.map((o) => o.value);
			} else {
				if (!values.includes(e.value)) values = values.concat(e.value);
				else values = values.filter((v) => v !== e.value);
			}
		} else {
			const oldValue = value;
			value = e.value;

			// We have to manually update in this case
			if (value === oldValue) updateDisplay(value);

			// After selecting we want to display all options again (this needs to happen after the reactive update based on value change)
			// tick().then(() => (filterOptions = getFilterOptions(searchValues)));

			close();
		}

		hovered = options.findIndex((o) => o.element === e.element);
		selectedIndex = hovered;

		// Change must happen after self has been updated
		tick().then(() => dispatch("change", self));
	}

	/** TODOC */
	function clearSearch(): void {
		Object.keys(search).forEach((key) => (search[key].value = ""));
		filterOptions = getFilterOptions(searchValues);
	}

	/** TODOC */
	function updateDisplay(value: unknown | null): void {
		if (multiple) return; // There is no obvious way to update display when multiple
		const option = options.find((o) => o.value === value);
		Object.keys(search).forEach((key) => {
			if (key in search) {
				const ref = search[key];
				if (key === DEFAULT_NAME) ref.value = `${option?.item}`;
				else if (isObject(option?.item)) ref.value = `${option.item[key]}`;
				else ref.value = "";
				searchValues[key] = ref.value;
			}
		});

		filterOptions = getFilterOptions(searchValues);
	}

	/** TODOC */
	function updateHighlighted(hovered: number, options: HTMLEnhancedOptionElement<T>[]): void {
		for (let i = 0; i < options.length; ++i) {
			const el = options[i].element;
			if (!el) continue;
			if (i === hovered) el.classList.add("highlighted");
			else el.classList.remove("highlighted");
		}
	}

	/** TODOC */
	function onWindowClick(e: MouseEvent): void {
		if (!container) return;
		if (e.target instanceof Node && container.contains(e.target)) return;
		open = false; // This should always close even if keepOpen
	}

	/** TODOC */
	function closeAndBlur(): void {
		close();
		focused = false;

		// If force, check if values are valid and if not, revert
		if (!force && !multiple) return;

		// First try to find based on search
		const item = getItemMatchingSearch(pool, searchValues);
		const option = options.find((o) => o.item === item);

		// If not found, do not change value and explicitly revert display
		if (typeof option === "undefined") updateDisplay(value);
		else value = option.value;
	}

	/** TODOC */
	function close(): void {
		if (keepOpen) return;
		if (reFocus) {
			reFocus.focus();
		} else if (container?.contains(document.activeElement)) {
			if (lastFocused) {
				lastFocused.focus();
			} else {
				const first = Object.keys(search)[0];
				if (search[first]) search[first].focus();
			}
		}
		open = false;
	}

	/** TODOC */
	function openAndFocus(): void {
		open = true;
		focused = true;
	}

	/** TODOC */
	function createIsChecked(multiple: boolean, value: unknown | null, values: unknown[]): (item: T) => boolean {
		return () => false;
		// if (multiple) return (item) => (isObject(item) && key ? values.includes(item[key] as K) : values.includes(item as unknown as K));
		// else return (item) => (isObject(item) && key ? value === item[key] : value === item);
	}

	/** TODOC */
	function createAllChecked(filtered: T[], values: unknown[]): () => boolean {
		return () => false;
		// return () => filtered.every((item) => (isObject(item) && key ? values.includes(item[key] as K) : values.includes(item as unknown as K)));
	}

	/** TODOC */
	function registerOption(option: HTMLEnhancedOptionElement<T>): void {
		if (!option.element || options.includes(option)) return;

		option.element.setAttribute("tabindex", "-1");
		option.element.addEventListener("click", onClick);
		option.element.addEventListener("mouseover", onMouseover);
		option.element.addEventListener("mouseout", onMouseout);

		options = options
			.concat(option)
			.filter((o) => o.element !== null)
			.sort((a, b) => {
				if (typeof document === "undefined") return 0;
				if (a.element!.compareDocumentPosition(b.element!) & Node.DOCUMENT_POSITION_PRECEDING) {
					return 1;
				} else {
					return -1;
				}
			});
	}

	/** TODOC */
	function onClick(this: HTMLDivElement): void {
		const option = options.find((o) => o.element === this);
		if (!option) return;
		selectElement(option);
	}

	/** TODOC */
	function onMouseover(e: Event): void {
		if (!(e.target instanceof HTMLElement)) return;
		hovered = options.findIndex((o) => o.element === <HTMLDivElement>e.target);
	}

	/** TODOC */
	function onMouseout(): void {
		hovered = selectedIndex;
	}

	/** TODOC */
	function onBlur(e: FocusEvent): void {
		if (!container) return;
		if (e.relatedTarget instanceof Node && container.contains(e.relatedTarget)) {
			return;
		}
		closeAndBlur();
	}

	/** TODOC */
	function onFocus(e: FocusEvent): void {
		if (e.target instanceof HTMLElement) lastFocused = e.target;
		openAndFocus();
	}

	/** TODOC */
	function getItemMatchingSearch(options: T[], search: Record<string, string>): T | null {
		return (
			options.find((item) =>
				isObject(item)
					? Object.keys(search).every((key) => search[key].toLowerCase() === `${item[key]}`.toLowerCase())
					: search[DEFAULT_NAME]?.toLowerCase() === `${item}`.toLowerCase()
			) ?? null
		);
	}

	/** TODOC */
	function checkHoverOverflow(): void {
		const last = options.filter((o) => !!o.element).length - 1;
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
	function getFilterOptions(search: Record<string, string>): (options: T[]) => T[] {
		return (options) => {
			pool = options;

			// First check if the search matches completely and is the current value. In this case, displaying only the option that is already selected doesn't provide much utility
			const item = getItemMatchingSearch(options, search);
			if (isObject(item) && Object.keys(search).every((key) => search[key].toLowerCase() === `${item[key]}`.toLowerCase())) {
				filtered = Array.from(options);
			} else if (`${item}`.toLowerCase() === search[DEFAULT_NAME]?.toLowerCase()) {
				filtered = Array.from(options);
			} else {
				filtered = Object.keys(search).reduce<T[]>(
					(prev, curr) =>
						prev.filter((item) => {
							const val = search[curr].toLowerCase();
							if (!val) return true; // If no search, display all
							return isObject(item) ? `${item[curr]}`.toLowerCase().includes(val) : `${item}`.toLowerCase().includes(val);
						}),
					Array.from(options)
				);
			}

			// Check if selectedIndex is still in range
			tick().then(checkHoverOverflow);
			return filtered;
		};
	}
</script>

<svelte:window on:keydown={onKeydown} on:click={onWindowClick} />

{#if name}
	{#if multiple}
		<select {name} multiple hidden>
			{#each values as value}
				<option selected {value} />
			{/each}
		</select>
	{:else}
		<input type="hidden" hidden {name} {value} />
	{/if}
{/if}
<div class:contents={!cssClass} class={cssClass} bind:this={container}>
	{#if observer}
		<slot {clearSearch} />
		<slot name="options" {registerOption} {filterOptions} {container} {open} />
	{/if}
</div>

<style>
	.contents {
		display: contents;
	}
</style>
