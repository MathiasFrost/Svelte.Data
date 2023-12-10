<script lang="ts">
	import type { HTMLEnhancedSelect } from "$lib/select/HTMLEnhancedSelect";
	import { onDestroy, tick } from "svelte";
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

	/** Multiple or single select */
	export let multiple = false;

	/** TODOC */
	export let open: boolean = false;

	/** Element to focus after closing */
	export let reFocus: HTMLElement | null = null;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** TODOC */
	export const self: HTMLEnhancedSelect<T> = {
		name,
		value: "",
		values: [],
		pool,
		filtered: pool,
		options: [],
		selectedIndex: 0,
		search: {},
		focus() {
			openAndFocus();
			reFocus?.blur();
		},
		close() {
			close();
		}
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

	// Convert value to number if it can be
	$: value = (Number(value) || value) as K;

	// TODOC
	$: setUpObserver(container);

	// TODOC
	$: updateHighlighted(hovered, options);

	// TODOC
	$: filtered = getOptions(pool, search);

	// Update display when value changes
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

	// Need to blur then display slot is destroyed
	$: if ($$slots["display"]) {
		if (open) {
			const first = Object.keys(search)[0];
			search[first]?.focus();
		} else {
			closeAndBlur();
		}
	}

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
					node.setAttribute("tabindex", "-1");
					if (typeof document !== "undefined" && document.activeElement === node) openAndFocus();
					if (!optionContainer && node.parentElement) {
						optionContainer = node.parentElement;
						optionContainer.addEventListener("mouseout", onMouseout);
					}
				} else if (action === "removed" && options.includes(node)) {
					options.splice(options.indexOf(node), 1);
				}
			} else if (
				node instanceof HTMLInputElement &&
				!node.hasAttribute("readonly") &&
				!node.getAttribute("readonly") &&
				!node.hasAttribute("disabled") &&
				!node.getAttribute("disabled") &&
				["text", "search"].includes(`${node.getAttribute("type")}`)
			) {
				if (action === "added") {
					node.setAttribute("autocomplete", "off");
					const name = node.name ? node.name : "[DEFAULT]";
					search[name] = node;
					updateDisplay(value); // Update display when the input is rendered
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
			if (!["Enter", " "].includes(e.key)) open = true;
			if (!["Enter", "Escape", " "].includes(e.key)) return;
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
			case " ":
				if (e.key === "Enter" && (!open || e.ctrlKey)) return;
				if (!multiple || (multiple && e.key === " " && e.ctrlKey)) {
					e.preventDefault();
					const item = options[hovered];
					if (item) selectElement(item);
				} else if (multiple && e.key === "Enter") {
					close();
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
		if (multiple) {
			const val = Number(attributeValue) || attributeValue;
			// If value does not exist we treat it as a "check all/uncheck all" option
			const exists = pool.some((item) => (isObject(item) && key ? item[key] === val : item === val));
			if (exists) {
				if (!values.includes(val as K)) {
					values.push(val as K);
				} else {
					const index = values.indexOf(val as K);
					if (index !== -1) values.splice(index, 1);
				}
				values = values;
			} else {
				const allCheckedFunc = createAllChecked(filtered, values);
				const allChecked = allCheckedFunc();
				if (allChecked) values = [];
				else values = filtered.map((item) => (isObject(item) && key ? ((Number(item[key]) || item[key]) as K) : ((Number(item) || item) as K)));
			}
		} else {
			const oldValue = value;
			if (!attributeValue) value = "" as K;
			else value = attributeValue as K;

			// We have to manually update in this case
			if (value === oldValue) updateDisplay(value);

			// After selecting we want to display all options again (this needs to happen after the reactive update based on value change)
			tick().then(() => (filtered = getOptions(pool, search)));

			close();
		}

		hovered = options.indexOf(e);
		selectedIndex = hovered;

		// Change must happen after self has been updated
		tick().then(() => dispatch("change", self));
	}

	/** TODOC */
	function clearSearch(): void {
		Object.keys(search).forEach((key) => (search[key].value = ""));
	}

	/** TODOC */
	function updateDisplay(value: K | null | undefined): void {
		if (multiple) return; // There is no obvious way to update display when multiple
		const item = pool.find((item) =>
			isObject(item) && key ? `${value}`.toLowerCase() === `${item[key]}`.toLowerCase() : `${item}`.toLowerCase() === `${value}`.toLowerCase()
		);
		if (isObject(item)) {
			Object.keys(search).forEach((key) => {
				if (key in search && key in item) {
					const ref = search[key];
					ref.value = `${item[key]}`;
				}
			});
		} else if (search["[DEFAULT]"]) {
			const ref = search["[DEFAULT]"];
			ref.value = `${item}`;
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
		open = false; // This should always close even if keepOpen
	}

	/** TODOC */
	function getOptions(pool: T[], search: Record<string, HTMLInputElement>): T[] {
		// First check if the search matches completely and is the current value. In this case, displaying only the option that is already selected doesn't provide much utility
		const item = pool.find((item) =>
			isObject(item)
				? Object.keys(search).every((key) => search[key].value.toLowerCase() === `${item[key]}`.toLowerCase())
				: search["[DEFAULT]"]?.value.toLowerCase() === `${item}`.toLowerCase()
		);
		if (
			isObject(item) &&
			key &&
			(item[key] === value || values.includes(item[key] as K)) &&
			Object.keys(search).every((key) => search[key].value.toLowerCase() === `${item[key]}`.toLowerCase())
		) {
			return Array.from(pool);
		} else if (`${item}`.toLowerCase() === search["[DEFAULT]"]?.value.toLowerCase() && (item === value || values.includes(item as K))) {
			return Array.from(pool);
		}

		return Object.keys(search).reduce<T[]>(
			(prev, curr) =>
				prev.filter((item) => {
					const val = search[curr].value.toLowerCase();
					if (!val) return true; // If no search, display all
					return isObject(item) ? `${item[curr]}`.toLowerCase().includes(val) : `${item}`.toLowerCase().includes(val);
				}),
			Array.from(pool)
		);
	}

	/** TODOC */
	function closeAndBlur(): void {
		close();
		focused = false;

		// If force, check if values are valid and if not, revert
		if (!force && !multiple) return;

		// First try to find based on search
		let item = pool.find((item) =>
			isObject(item)
				? Object.keys(search).every((key) => search[key].value.toLowerCase() === `${item[key]}`.toLowerCase())
				: search["[DEFAULT]"]?.value.toLowerCase() === `${item}`.toLowerCase()
		);

		// If not found, do not change value and explicitly revert display
		if (typeof item === "undefined") {
			updateDisplay(value);
		} else if (isObject(item)) {
			value = item[key] as K;
		} else {
			value = item as K;
		}
	}

	/** TODOC */
	function close(): void {
		if (keepOpen) return;
		if (reFocus) {
			reFocus.focus();
		} else {
			const first = Object.keys(search)[0];
			if (search[first]) search[first].focus();
		}
		open = false;
	}

	/** TODOC */
	function openAndFocus(): void {
		open = true;
		focused = true;
	}

	/** TODOC */
	function createIsChecked(multiple: boolean, value: K | null | undefined, values: K[]): (item: T) => boolean {
		if (multiple) return (item) => (isObject(item) && key ? values.includes(item[key] as K) : values.includes(item as unknown as K));
		else return (item) => (isObject(item) && key ? value === item[key] : value === item);
	}

	/** TODOC */
	function createAllChecked(filtered: T[], values: K[]): () => boolean {
		return () => filtered.every((item) => (isObject(item) && key ? values.includes(item[key] as K) : values.includes(item as unknown as K)));
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
		{#if $$slots["display"] && multiple && !focused && !open}
			<slot name="display" {clearSearch} isChecked={createIsChecked(multiple, value, values)} />
		{:else}
			<slot name="search" {clearSearch} isChecked={createIsChecked(multiple, value, values)} />
		{/if}
		{#if open}
			<slot name="options" options={filtered} isChecked={createIsChecked(multiple, value, values)} allChecked={createAllChecked(filtered, values)} />
		{/if}
	{/if}
</div>

<style>
	.contents {
		display: contents;
	}
</style>
