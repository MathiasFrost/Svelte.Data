<script lang="ts">
	import type { HTMLEnhancedSelectElement } from "$lib/select/HTMLEnhancedSelectElement.js";
	import { createEventDispatcher, onDestroy, tick } from "svelte";
	import { ensureObject, isObject } from "$lib/types";
	import type { HTMLEnhancedOptionElement } from "$lib/select/HTMLEnhancedOptionElement.js";
	import type { HTMLPopupElement } from "$lib/popup";

	/** Type of the array element */
	type T = $$Generic;

	// /** Type of the value */
	// type K = $$Generic;

	/** Name for the default input element for `search` */
	const DEFAULT_NAME = "[DEFAULT]";

	/** TODOC */
	const dispatch = createEventDispatcher<{ change: HTMLEnhancedSelectElement<T> }>();

	/** Current value */
	export let value: unknown | null = null;

	/** Current value for multiple select */
	export let values: (unknown | null)[] = [];

	/** Name of this select as a form input */
	export let name = "";

	/** Option pool */
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

	/** CSS class for the container */
	let cssClass = "";
	export { cssClass as class };

	/** @see HTMLEnhancedSelectElement */
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
			open = false;
		}
	};

	/** When the EnhancedSelect expects the container to be open if gated behind an `#if`-block */
	let open: boolean;

	/** Passed as a slot prop for implementation to potentially hide options when not reasonable */
	let focused: boolean = false;

	/** The popup element if any is registered */
	let popup: HTMLPopupElement | null = null;

	/** The current option index that will be selected when pressing enter */
	let selectedIndex = 0;

	/** The current option index that is either selected with keyboard or hovered with mouse */
	let hovered = selectedIndex;

	/** The search elements inside the container */
	let search: Record<string, HTMLInputElement> = {};

	/** The search values of `search` */
	let searchValues: Record<string, string> = {};

	/** Filter options passed in and register them internally */
	let filterOptions: (options: T[]) => T[] = getFilterOptions(searchValues);

	/** The filtered `pool` */
	let filtered: T[] = [];

	/** The found `EnhancedOption` elements inside the container */
	let options: HTMLEnhancedOptionElement<T>[] = [];

	/** Function passed to slot that can be called to retrieve references to checked elements */
	let getChecked: () => T[] = createGetChecked(options, values);

	/** Container of all content */
	let container: HTMLDivElement | null = null;

	/** Observer for `container` */
	let observer: MutationObserver | null = null;

	/** Observer for `popup.popupContainer` */
	let popupObserver: MutationObserver | null = null;

	/** Last focused `search` element that can be refocused after selecting a value */
	let lastFocused: HTMLElement | null = null;

	/** First element found that scrolls. Assumed to be the main scroll box for options */
	let scrollBox: HTMLElement | null = null;

	/** If all options are checked when `multiple` */
	let allChecked = false;

	// Update `allChecked` when options and values changes
	$: allChecked = updateAllChecked(options, values);

	// Update `getChecked` when options and values changes
	$: getChecked = createGetChecked(options, values);

	// Set up observer for container when bound
	$: setUpObserver(container);

	// Update highlighted option when options and hovered changes
	$: updateHighlighted(hovered, options);

	// Update display when value changes
	$: updateDisplay(value);

	// Update the checked value for `EnhancedOption` elements to match values
	$: updateValues(options, values);

	// Update all references
	$: self.value = value;
	$: self.values = values;
	$: self.search = search;
	$: self.options = options;
	$: self.pool = pool;
	$: self.filtered = filtered;
	$: self.selectedIndex = selectedIndex;
	$: self.name = name;

	// cleanup
	onDestroy(() => {
		observer?.disconnect();
		popupObserver?.disconnect();
	});

	/** Register popup and apply observer */
	function registerPopup(selectPopup: HTMLPopupElement): void {
		popup = selectPopup;
		if (!popup.popupContainer) return;
		popupObserver = new MutationObserver(mutationCallback);
		popupObserver.observe(popup.popupContainer, { attributes: false, childList: true, subtree: true });
	}

	/** Set up observer on the `container` */
	function setUpObserver(container: HTMLDivElement | null): void {
		if (!container || observer) return;
		observer = new MutationObserver(mutationCallback);
		observer.observe(container, { attributes: false, childList: true, subtree: true });
	}

	/** Handler for `observer`s */
	function mutationCallback(mutationsList: MutationRecord[]): void {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => searchForElements(node, "added"));
				mutation.removedNodes.forEach((node) => searchForElements(node, "removed"));
			}
		}
		options = options;

		if (open) scrollToOptionIfNeeded();
	}

	/** Search for relevant elements among the mutated elements (`search`, `scrollBox`) */
	function searchForElements(node: Node, action: "removed" | "added") {
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
			node.childNodes.forEach((node) => searchForElements(node, action));
		}
	}

	/** Handle global keyboard events */
	function onKeydown(e: KeyboardEvent): void {
		if (!focused && !global) return;
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
					if (multiple) {
						close();
						return;
					}
					const item = options[hovered];
					if (item) {
						selectElement(item);
						return;
					}
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
				open = true;
				return;
		}

		open = true;
		selectedIndex = hovered;
		scrollToOptionIfNeeded();
	}

	/** Scroll to option if it is out of view */
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

	/** Handle `search` element inputs */
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

	/** Update the `checked` value of `EnhancedOption`s */
	function updateValues(options: HTMLEnhancedOptionElement<T>[], values: (unknown | null)[]): void {
		for (const option of options) {
			if (values.includes(option.value)) option.setChecked(true);
			else option.setChecked(false);
		}
	}

	/** Clear the `search` values */
	function clearSearch(): void {
		Object.keys(search).forEach((key) => (search[key].value = ""));
		filterOptions = getFilterOptions(searchValues);
	}

	/** Update the `search` element's search value to match current value */
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

	/** Add `highlighted` class to `hovere`d element */
	function updateHighlighted(hovered: number, options: HTMLEnhancedOptionElement<T>[]): void {
		for (let i = 0; i < options.length; ++i) {
			const el = options[i].element;
			if (!el) continue;
			if (i === hovered) el.classList.add("highlighted");
			else el.classList.remove("highlighted");
		}
	}

	/** Handle global click events */
	function onWindowClick(e: MouseEvent): void {
		if (!container) return;
		if (e.target instanceof Node && (container.contains(e.target) || (popup?.popupContainer && popup.popupContainer.contains(e.target)))) return;
		closeAndBlur();
	}

	/** Handle closing and blurring of this component */
	function closeAndBlur(): void {
		close();
		focused = false;
		// If force, check if values are valid and if not, revert
		if (!force && !multiple) return;

		// First try to find based on search
		const option = getOptionMatchingSearch(searchValues);

		// If not found, do not change value and explicitly revert display
		if (!option) updateDisplay(value);
		else value = option.value;
	}

	/** Handle closing of this component */
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

	/** Handle opening and focusing of this component */
	function openAndFocus(): void {
		open = true;
		focused = true;
	}

	/** Register an `EnhancedOption` element */
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

	/** Handle `search` element click */
	function onClick(this: HTMLDivElement): void {
		const option = options.find((o) => o.element === this);
		if (!option) return;
		selectElement(option);
	}

	/** Handle `search` element mouseover */
	function onMouseover(e: Event): void {
		if (!(e.target instanceof HTMLElement)) return;
		hovered = options.findIndex((o) => o.element === <HTMLDivElement>e.target);
	}

	/** Handle `search` element mouseout */
	function onMouseout(): void {
		hovered = selectedIndex;
	}

	/** Handle `search` element blur */
	function onBlur(e: FocusEvent): void {
		if (!container) return;
		if (
			(e.relatedTarget instanceof Node && container.contains(e.relatedTarget)) ||
			options.some((o) => o.element === <HTMLElement | null>e.relatedTarget)
		) {
			return;
		}
		closeAndBlur();
	}

	/** Handle `search` element focus */
	function onFocus(e: FocusEvent): void {
		if (e.target instanceof HTMLElement) lastFocused = e.target;
		openAndFocus();
	}

	/** Get the option fully matching search strings */
	function getOptionMatchingSearch(search: Record<string, string>): HTMLEnhancedOptionElement<T> | null {
		return (
			options.find((o) => {
				if (o.item === null) return Object.keys(search).every((key) => !search[key]);
				if (isObject(o.item)) return Object.keys(search).every((key) => search[key].toLowerCase() === `${ensureObject(o.item)[key]}`.toLowerCase());
				return search[DEFAULT_NAME]?.toLowerCase() === `${o}`.toLowerCase();
			}) ?? null
		);
	}

	/** Check if the currently `hovered` option gone from view */
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

	/** Construct the function that should filter the pool of options based on `search` values */
	function getFilterOptions(search: Record<string, string>): (options: T[]) => T[] {
		return (options) => {
			pool = options;

			// First check if the search matches completely and is the current value. In this case, displaying only the option that is already selected doesn't provide much utility
			const option = getOptionMatchingSearch(search);
			if (isObject(option?.item) && Object.keys(search).every((key) => search[key].toLowerCase() === `${ensureObject(option.item)[key]}`.toLowerCase())) {
				filtered = Array.from(options);
			} else if (`${option?.item}`.toLowerCase() === search[DEFAULT_NAME]?.toLowerCase()) {
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

	/** Check if all pool options are contained in `values` */
	function updateAllChecked(options: HTMLEnhancedOptionElement<T>[], values: unknown[]): boolean {
		return options.every((o) => values.includes(o.value));
	}

	/** Create the function that gets all pool options contained in `values` */
	function createGetChecked(options: HTMLEnhancedOptionElement<T>[], values: unknown[]): () => T[] {
		return () => options.filter((o) => values.includes(o.value) && !!o.item).map((o) => o.item!);
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
		<slot {clearSearch} {allChecked} {filtered} {getChecked} />
		<slot name="options" {registerOption} {registerPopup} {filterOptions} {container} {open} {filtered} {allChecked} />
	{/if}
</div>

<style>
	.contents {
		display: contents;
	}
</style>
