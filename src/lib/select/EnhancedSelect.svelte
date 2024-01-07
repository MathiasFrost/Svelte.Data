<script lang="ts" generics="T, K = string">
	import { createEventDispatcher, onDestroy, tick } from "svelte";
	import type { SvelteEnhancedSelectElement } from "$lib/select/SvelteEnhancedSelectElement.js";
	import type { SveltePopupElement } from "$lib/popup/SveltePopupElement.js";
	import type { SvelteEnhancedOptionElement } from "$lib/select/SvelteEnhancedOptionElement.js";
	import { PopupHelper } from "$lib/popup/index.js";
	import { ensureObject, isObject } from "$lib/types/index.js";
	import Popup from "$lib/popup/Popup.svelte";
	import { outClick } from "$lib/popup/index.js";

	/** Name for the default input element for `search` */
	const DEFAULT_NAME = "[DEFAULT]";

	/** TODOC */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	const dispatch = createEventDispatcher<{ change: SvelteEnhancedSelectElement<T, K> }>();

	/** Current value */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let value: K | null = null;

	/** Current value for multiple select */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let values: (K | null)[] = [];

	/** Name of this select as a form input */
	export let name = "";

	/** Option pool */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let pool: T[] = [];

	/** Select ID */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let selectValue: (item: T) => K = (item) => `${item}` as K;

	/** TODOC */
	export let delay: number = 0;

	/** Force display text to be valid when blurred */
	export let force = false;

	/** Multiple or single select */
	export let multiple = false;

	/** If options should be wrapped in a <Popup> */
	export let popup = false;

	/** If popup should be a centered modal on small screens */
	export let modalSmall = false;

	/** If we should never prevent default on enter */
	export let submit = false;

	/** CSS class for the container */
	let cssClass = "";
	export { cssClass as class };

	/** When the EnhancedSelect expects the container to be open if gated behind an `#if`-block */
	let open: boolean = false;

	/** Passed as a slot prop for implementation to potentially hide options when not reasonable */
	let focused: boolean = false;

	/** The popup element if any is registered */
	let popupElement: SveltePopupElement | undefined;

	/** Need to preserve the item corresponding to the value for `force` revert */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	let selected: T | null = null;

	/** References to checked elements */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	let checked: T[];

	/** The current option index that will be selected when pressing enter */
	let selectedIndex = 0;

	/** The current option index that is either selected with keyboard or hovered with mouse */
	let hovered = selectedIndex;

	/** The search elements inside the container */
	let searchInputs: Record<string, HTMLInputElement> = {};

	/** The search values of `search` */
	let searchValues: Record<string, string> = {};

	/** Filter options passed in and register them internally */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	let filterOptions: (options: T[], allOnEmpty?: boolean) => T[] = getFilterOptions(searchValues);

	/** The found `EnhancedOption` elements inside the container */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	let options: SvelteEnhancedOptionElement<T>[] = [];

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

	/** TODOC */
	let timeout = 0;

	/** @see SvelteEnhancedSelectElement */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export const self: SvelteEnhancedSelectElement<T, K> = {
		get name() {
			return name;
		},
		get value() {
			return value;
		},
		get values() {
			return values;
		},
		get pool() {
			return pool;
		},
		get options() {
			return options;
		},
		get selectedIndex() {
			return selectedIndex;
		},
		get search() {
			return searchInputs;
		},
		focus() {
			focus();
		},
		showOptions() {
			showOptions();
		},
		close() {
			close();
		}
	};

	// cleanup
	onDestroy(() => {
		observer?.disconnect();
		popupObserver?.disconnect();
	});

	/** Register popup and apply observer */
	function registerPopup(selectPopup: SveltePopupElement | undefined): void {
		popupElement = selectPopup;

		if (!popupElement?.innerContainer) return;

		// First run is manual
		if (!popupObserver) {
			searchForElements(popupElement.innerContainer, "added");
		}

		popupObserver = new MutationObserver(mutationCallback);
		popupObserver.observe(popupElement.innerContainer, { childList: true, subtree: true });
	}

	/** Set up observer on the `container` */
	function setUpObserver(container: HTMLDivElement | null): void {
		if (!container) return;

		// First run is manual
		if (!observer) {
			container.addEventListener("click", showOptions);
			searchForElements(container, "added");

			// Update after gathering search inputs
			filterOptions = getFilterOptions(searchValues);
		}

		observer = new MutationObserver(mutationCallback);
		observer.observe(container, { childList: true, subtree: true });
	}

	/** Handler for `observer`s */
	function mutationCallback(mutationsList: MutationRecord[]): void {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				mutation.removedNodes.forEach((node) => searchForElements(node, "removed"));
				mutation.addedNodes.forEach((node) => searchForElements(node, "added"));
			}
		}
		options = options;
		if (focused) scrollToOptionIfNeeded();

		// Update after gathering search inputs
		filterOptions = getFilterOptions(searchValues);
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

			// Find search inputs
			if (
				node instanceof HTMLInputElement ||
				node instanceof HTMLButtonElement ||
				node instanceof HTMLTextAreaElement ||
				(node instanceof HTMLElement && node.hasAttribute("tabindex") && node.getAttribute("tabindex") !== "-1")
			) {
				if (action === "added") {
					node.addEventListener("blur", onBlur);
					node.addEventListener("focus", onFocus);
					if (typeof document !== "undefined" && document.activeElement === node && document.activeElement instanceof HTMLElement) {
						if (!popupElement?.innerContainer?.contains(node)) {
							lastFocused = node;
						}
						focused = true;
					}

					if (
						node.getAttribute("tabindex") !== "-1" &&
						node instanceof HTMLInputElement &&
						!node.hasAttribute("disabled") &&
						!node.hasAttribute("readonly") &&
						["text", "search"].includes(`${node.getAttribute("type")}`)
					) {
						node.addEventListener("input", onInput);
						node.addEventListener("keydown", searchKeydown);

						node.setAttribute("autocomplete", "off");
						const name = node.name ? node.name : DEFAULT_NAME;
						searchInputs[name] = node;
						searchValues[name] = node.value;
					}
				} else {
					delete searchInputs[name];
					delete searchValues[name];
				}
			}

			if (node instanceof HTMLElement && node.hasAttribute("tabindex") && node.getAttribute("tabindex") !== "-1") {
				node.addEventListener("blur", onBlur);
				node.addEventListener("focus", onFocus);
				if (typeof document !== "undefined" && document.activeElement === node && document.activeElement instanceof HTMLElement) {
					if (!popupElement?.innerContainer?.contains(node)) {
						lastFocused = node;
					}
					focused = true;
				}
			}
		}

		// If the node has child nodes, recursively search them
		if (node.hasChildNodes()) {
			node.childNodes.forEach((node) => searchForElements(node, action));
		}
	}

	/** Make sure tabbing works */
	function searchKeydown(e: KeyboardEvent): void {
		if (e.key !== "Tab") return;
		if (!(e.target instanceof HTMLElement)) return;

		const name = e.target.getAttribute("name")?.toString() ?? DEFAULT_NAME;
		const keys = Object.keys(searchInputs);
		const index = keys.indexOf(name);
		if (!e.shiftKey && index < keys.length - 1) {
			e.preventDefault();
			searchInputs[keys[index + 1]].focus();
			return;
		} else if (e.shiftKey && index > 0) {
			e.preventDefault();
			searchInputs[keys[index - 1]].focus();
			return;
		}

		if (!PopupHelper.hasMoreFocusable(popupElement?.innerContainer ?? container, e.shiftKey)) {
			e.preventDefault();
			close();
		}
	}

	/** Handle global keyboard events */
	function onKeydown(e: KeyboardEvent): void {
		if (!focused) return;
		// Check if enter should pass through to a possible submit event
		if ((!open && e.key === "Enter") || (e.key === "Enter" && e.ctrlKey)) {
			close();
			return;
		}
		switch (e.key) {
			case "ArrowUp":
				e.preventDefault();
				if (hovered > 0) hovered--;
				break;
			case "ArrowDown":
				e.preventDefault();
				if (hovered < options.filter((o) => !!o.element).length - 1) hovered++;
				break;
			case "Enter":
				{
					if (!submit) e.preventDefault();
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
				if (multiple && e.ctrlKey) {
					e.preventDefault();
					const item = options[hovered];
					if (item) selectElement(item);
				} else if (!open) {
					e.preventDefault();
				}
				break;
			case "Delete":
				e.preventDefault();
				clearSearch();
				break;
			case "Escape":
				close();
				return;
			default:
				return;
		}

		showOptions().then(() => {
			selectedIndex = hovered;
			scrollToOptionIfNeeded();
		});
	}

	/** Handle window clicks */
	function onWindowClick(): void {
		// If we are using popup, defer out click to it
		if (popupElement?.innerContainer) return;
		close();
		blur();
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
				// If the item is below the visible area, scroll, so it's at the bottom
				scrollBox.scrollTo({ behavior: "instant", top: scrollBox.scrollTop + rect.bottom - boxRect.bottom });
			}
		}
	}

	/** Handle `search` element inputs */
	function onInput(this: HTMLInputElement): void {
		// If not open, open when interacting
		if (!open) {
			showOptions().then(() => {
				selectedIndex = hovered;
				scrollToOptionIfNeeded();
			});
		}

		const name = this.getAttribute("name")?.toString();

		if (delay) {
			window.clearTimeout(timeout);
			timeout = window.setTimeout(() => {
				if (name) searchValues[name] = this.value;
				else searchValues[DEFAULT_NAME] = this.value;
			}, delay);
		} else {
			if (name) searchValues[name] = this.value;
			else searchValues[DEFAULT_NAME] = this.value;
			filterOptions = getFilterOptions(searchValues);
		}
	}

	/** Called when the decision has been made to select an option */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function selectElement(e: SvelteEnhancedOptionElement<T>): void {
		if (multiple) {
			if (e.togglesAll) {
				const visible = options.filter((o) => !!o.element);
				const allChecked = visible.every((o) => o.checked);
				if (allChecked) values = [];
				else values = visible.map((o) => (o.item === null ? null : selectValue(o.item)));
			} else {
				if (!values.includes(e.item === null ? null : selectValue(e.item))) values = values.concat(e.item === null ? null : selectValue(e.item));
				else values = values.filter((v) => v !== (e.item === null ? null : selectValue(e.item)));
			}
		} else {
			const oldValue = value;
			value = e.item === null ? null : selectValue(e.item);

			// We have to manually update in this case
			if (value === oldValue) {
				updateDisplay(value);
			}

			filterOptions = getFilterOptions(searchValues);
			tick().then(close);
		}

		hovered = options.findIndex((o) => o.element === e.element);
		selectedIndex = hovered;

		// Change must happen after self has been updated
		tick().then(() => dispatch("change", self));
	}

	/** Update the `checked` value of `EnhancedOption`s */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function updateValues(options: SvelteEnhancedOptionElement<T>[], values: (K | null)[]): void {
		for (const option of options) {
			if (values.includes(option.item === null ? null : selectValue(option.item))) option.setChecked(true);
			else option.setChecked(false);
		}
	}

	/** Clear the `search` values */
	function clearSearch(): void {
		Object.keys(searchInputs).forEach((key) => (searchInputs[key].value = ""));
		filterOptions = getFilterOptions(searchValues);
	}

	/** Update the `search` element's search value to match current value */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function updateDisplay(value: K | null): void {
		if (multiple) return; // There is no obvious way to update display when multiple

		// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
		// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
		let item: T | null | undefined;
		if (value === null) {
			item = null;
			selected = null;
		} else {
			item = pool.find((o) => selectValue(o) === value);

			if (item) selected = item;
			else item = selected;
		}

		Object.keys(searchInputs).forEach((key) => {
			if (key in searchInputs) {
				const ref = searchInputs[key];
				if (key === DEFAULT_NAME) ref.value = `${item}`;
				else if (isObject(item)) ref.value = `${item[key]}`;
				else ref.value = "";
				searchValues[key] = ref.value;
			}
		});
	}

	/** Add `highlighted` class to `hover`d element */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function updateHighlighted(hovered: number, options: SvelteEnhancedOptionElement<T>[]): void {
		for (let i = 0; i < options.length; ++i) {
			const el = options[i].element;
			if (!el) continue;
			if (i === hovered) el.classList.add("highlighted");
			else el.classList.remove("highlighted");
		}
	}

	/** Handle blurring of this component */
	function blur(): void {
		focused = false;

		// If ´force´, check if values are valid and if not, revert
		if (!force && !multiple) return;

		// First try to find based on search
		const option = getOptionMatchingSearch(searchValues);

		// If not found, do not change value and explicitly revert display
		if (!option?.item) {
			updateDisplay(value);
			filterOptions = getFilterOptions(searchValues);
		} else {
			const oldValue = selectValue(option.item);
			if (value === oldValue) updateDisplay(value);
			else value = oldValue;
		}
	}

	/** Handle opening and focusing of this component */
	function focus(): void {
		const first = Object.keys(searchInputs)[0];
		if (searchInputs[first]) searchInputs[first].focus();
		focused = true;
	}

	/** Handle opening and focusing of this component */
	async function showOptions(): Promise<void> {
		if (open) return;
		if (popup) {
			await popupElement?.showPopup();
			registerPopup(popupElement);
		}
		open = true;
		focused = true;
	}

	/** Handle opening and focusing of this component */
	function close(): void {
		if (!open) return;
		if (!Object.keys(searchInputs).length && !popupElement?.lastFocused) focused = false;
		if (popup) {
			Object.keys(searchInputs).forEach((key) => {
				if (popupElement?.innerContainer?.contains(searchInputs[key])) delete searchInputs[key];
			});
			popupElement?.close();
			popupObserver?.disconnect();
			popupObserver = null;
		}
		open = false;
	}

	/** Register an `EnhancedOption` element */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function registerOption(option: SvelteEnhancedOptionElement<T>): void {
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
		hovered = options.findIndex((o) => o.element === <HTMLDivElement>e.currentTarget);
	}

	/** Handle `search` element mouseout */
	function onMouseout(): void {
		hovered = selectedIndex;
	}

	/** Handle `search` element blur */
	function onBlur(e: FocusEvent): void {
		if (!container) return;
		// Don't close if new target is inside either popup or container
		if (
			!e.relatedTarget ||
			(e.relatedTarget instanceof Node && (container.contains(e.relatedTarget) || popupElement?.innerContainer?.contains(e.relatedTarget))) ||
			options.some((o) => <Element>o.element === <Element>e.relatedTarget)
		) {
			return;
		}
		close();
		blur();
	}

	/** Handle `search` element focus */
	function onFocus(e: FocusEvent): void {
		if (e.target instanceof HTMLElement && !popupElement?.innerContainer?.contains(document.activeElement)) lastFocused = e.target;
		if (!lastFocused && e.relatedTarget instanceof HTMLElement) lastFocused = e.relatedTarget;
		focused = true;
	}

	/** Get the option fully matching search strings */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function getOptionMatchingSearch(search: Record<string, string>): SvelteEnhancedOptionElement<T> | null {
		return (
			options.find((o) => {
				if (isObject(o.item)) return Object.keys(search).every((key) => search[key].toLowerCase() === `${ensureObject(o.item)[key]}`.toLowerCase());
				return search[DEFAULT_NAME]?.toLowerCase() === `${o.item}`.toLowerCase();
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
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function getFilterOptions(search: Record<string, string>): (options: T[], allOnEmpty?: boolean) => T[] {
		return (options, allOnEmpty) => {
			pool = options;
			// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
			// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
			let filtered: T[] = [];

			// First check if the search matches completely and is the current value. In this case, displaying only the option that is already selected doesn't provide much utility
			const option = getOptionMatchingSearch(search);
			if (
				isObject(option?.item) &&
				Object.keys(search).every((key) => search[key].toLowerCase() === `${ensureObject(option?.item)[key]}`.toLowerCase())
			) {
				filtered = Array.from(options);
			} else if (`${option?.item}`.toLowerCase() === search[DEFAULT_NAME]?.toLowerCase()) {
				filtered = Array.from(options);
			} else {
				// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
				// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
				filtered = Object.keys(search).reduce<T[]>(
					(prev, curr) =>
						prev.filter((item) => {
							const val = search[curr].toLowerCase();
							if (!val) return allOnEmpty !== false; // If no search, display all
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
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function updateAllChecked(options: SvelteEnhancedOptionElement<T>[], values: (K | null)[]): boolean {
		return options.filter((o) => !!o.element).every((o) => values.includes(o.item === null ? null : selectValue(o.item)));
	}

	/** TODOC */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function getChecked(pool: T[], values: (K | null)[]): T[] {
		// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
		return values.reduce<T[]>((prev, curr) => {
			let found = pool.find((item) => selectValue(item) === curr);
			// Pool could have changed since last time, so source from checked as well if not found in pool
			found ??= checked.find((item) => selectValue(item) === curr);
			if (found) prev.push(found);
			return prev;
		}, []);
	}

	// Update `allChecked` when options and values changes
	$: allChecked = updateAllChecked(options, values);

	// Set up observer for container when bound
	$: setUpObserver(container);

	// Update highlighted option when options and hovered changes
	$: updateHighlighted(hovered, options);

	// Update display when value changes
	$: updateDisplay(value);

	// Update the checked value for `EnhancedOption` elements to match values
	$: updateValues(options, values);

	// TODOC
	$: checked = getChecked(pool, values);
</script>

<svelte:window on:keydown={onKeydown} />

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

<div class:contents={!cssClass} class={cssClass} bind:this={container} use:outClick={onWindowClick}>
	<slot name="summary" {clearSearch} {container} {allChecked} {open} {value} {values} {searchValues} {selected} {checked} />
	{#if !popup}
		<slot {registerOption} {filterOptions} {clearSearch} {container} {allChecked} {open} {value} {values} {searchValues} {selected} {checked} />
	{/if}
</div>
{#if popup}
	<Popup bind:self={popupElement} anchor={container} {modalSmall} align="stretch" contain on:close={close}>
		<slot {registerOption} {filterOptions} {clearSearch} {container} {allChecked} {open} {value} {values} {searchValues} {selected} {checked} />
	</Popup>
{/if}

<style lang="scss">
	.contents {
		display: contents;
	}
</style>
