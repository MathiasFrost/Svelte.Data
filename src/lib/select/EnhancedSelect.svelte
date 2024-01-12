<script lang="ts" generics="T, K extends string | number | boolean | bigint = string">
	import { createEventDispatcher, onDestroy, onMount, tick } from "svelte";
	import type { SvelteEnhancedSelectElement, Option } from "$lib/select/SvelteEnhancedSelectElement.js";
	import type { SveltePopupElement } from "$lib/popup/SveltePopupElement.js";
	import { PopupHelper } from "$lib/popup/index.js";
	import { ensureObject, isObject } from "$lib/types/index.js";
	import Popup from "$lib/popup/Popup.svelte";
	import { outClick } from "$lib/popup/index.js";

	/** Name for the default input element for `search` */
	const DEFAULT_NAME = "[DEFAULT]";

	/** String to identify check all options */
	const CHECK_ALL = "[CHECK_ALL]";

	/** String to identify uncheck all options */
	const UNCHECK_ALL = "[UNCHECK_ALL]";

	/** TODOC */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	const dispatch = createEventDispatcher<{ change: SvelteEnhancedSelectElement<T, K> }>();

	/** Current value */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let value: K | null = null;

	/** Current value for multiple select */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let values: (K | null)[] = [];

	/** Name of this select as a form input */
	export let name = "";

	/** Initial option pool */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let pool: T[] = [];

	/** Select primary key. Can be a property name or a function */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let key: string | ((item: T) => K) | undefined = void 0;

	/** Delay filter by this. Useful for async data to avoid fetching on every keystroke. */
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

	/** Show options on focus */
	export let showOnFocus = false;

	/** CSS class for the container */
	let cssClass = "";
	export { cssClass as class };

	/** When the EnhancedSelect expects the container to be open if gated behind an `#if`-block */
	let open: boolean = false;

	/** Passed as a slot prop for implementation to potentially hide options when not reasonable */
	let focused: boolean = false;

	/** The popup element if any is registered */
	let popupElement: SveltePopupElement | undefined;

	/** Dynamic pool and initial pool */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	let totalPool: T[] = pool;

	/** Need to preserve the item corresponding to the value for `force` revert */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	let selected: T | null = null as unknown as T; // svelte-check can't infer that this variable can be assigned later in the component's lifecycle

	/** References to checked elements */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	let checked: T[];

	/** The current option index that will be selected when pressing enter */
	let selectedIndex = -1;

	/** The current option index that is either selected with keyboard or hovered with mouse */
	let hovered = selectedIndex;

	/** The search elements inside the container */
	let searchInputs: Record<string, HTMLInputElement> = {};

	/** The search values of `search` */
	let searchValues: Record<string, string> = {};

	/** Filter options passed in and register them internally */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	let filterOptions: (options: T[], allOnEmpty?: boolean) => T[] = getFilterOptions(searchValues);

	/** The currently rendered pool elements */
	let options: Option[] = [];

	/** Container of all content */
	let container: HTMLDivElement | null = null;

	/** Observer for `container` */
	let observer: MutationObserver | null = null;

	/** Observer for `popup.popupContainer` */
	let popupObserver: MutationObserver | null = null;

	/** First element found that scrolls. Assumed to be the main scroll box for options */
	let scrollBox: HTMLElement | null = null;

	/** If all options are checked when `multiple` */
	let allChecked = false;

	/** Delay filter timeout */
	let timeout = 0;

	/** @see SvelteEnhancedSelectElement */
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
			return totalPool;
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
			const first = Object.keys(searchInputs)[0];
			if (searchInputs[first]) searchInputs[first].focus();
			onFocusIn();
		},
		showOptions() {
			showOptions();
		},
		close() {
			// If popup, defer closing to it
			if (popupElement?.open) return;
			else close();
		}
	};

	// Set up observer on the `container`
	onMount(() => {
		if (!container) return;

		// First run is manual
		if (!observer) {
			container.addEventListener("click", showOptions);
			searchForElements(container, "added");
		}

		observer = new MutationObserver(mutationCallback);
		observer.observe(container, { childList: true, subtree: true });

		container.addEventListener("focusout", onFocusOut);
		container.addEventListener("focusin", onFocusIn);
	});

	// cleanup
	onDestroy(() => {
		observer?.disconnect();
		popupObserver?.disconnect();
	});

	/** TODOC */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function getKey(item: T | null): K | null {
		if (item === null) return null;

		// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
		if (typeof key === "string" && isObject(item)) return item[key] as unknown as K;
		if (typeof key === "function") return key(item);

		// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
		return item as unknown as K;
	}

	/** Handler for `observer`s */
	function mutationCallback(mutationsList: MutationRecord[]): void {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				mutation.removedNodes.forEach((node) => searchForElements(node, "removed"));
				mutation.addedNodes.forEach((node) => searchForElements(node, "added"));
			}
		}

		if (focused) scrollToOptionIfNeeded();
	}

	/** Search for relevant elements among the mutated elements (`search`, `scrollBox`) */
	function searchForElements(node: Node, action: "removed" | "added") {
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
					if (typeof document !== "undefined" && document.activeElement === node) {
						onFocusIn();
					}

					if (
						node.getAttribute("tabindex") !== "-1" &&
						node instanceof HTMLInputElement &&
						!node.hasAttribute("disabled") &&
						!node.hasAttribute("readonly") &&
						["text", "search"].includes(`${node.getAttribute("type")}`)
					) {
						node.addEventListener("input", onInput);
						node.setAttribute("autocomplete", "off");
						const name = node.name ? node.name : DEFAULT_NAME;
						searchInputs[name] = node;
						searchValues[name] = node.value;

						updateFilter();
					}
				} else {
					delete searchInputs[name];
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
		if (!focused) return;

		// Check if enter should pass through to a possible submit event
		if (!open && e.key === "Enter") return;
		if (e.key === "Enter" && e.ctrlKey) {
			close();
			return;
		}

		switch (e.key) {
			case "ArrowUp":
				e.preventDefault();
				if (hovered >= 0) hovered--;
				break;
			case "ArrowDown":
				e.preventDefault();
				if (hovered < options.length - 1) hovered++;
				break;
			case "Enter": {
				// This will make selecting and submitting happen in one keystroke
				if (!submit) e.preventDefault();
				if (multiple) {
					close();
					return;
				}
				const item = options[hovered];
				if (item) {
					selectOption(item);
					return;
				} else {
					close();
					return;
				}
			}
			case " ":
				if (multiple && e.ctrlKey) {
					e.preventDefault();
					const item = options[hovered];
					if (item) selectOption(item);
				} else if (!open) {
					e.preventDefault();
				}
				break;
			case "Delete":
				// If already cleared then return
				if (Object.keys(searchValues).every((key) => !searchValues[key])) return;
				e.preventDefault();
				clearSearch();
				break;
			case "Escape":
				close();
				return;
			default:
				return;
		}

		showOptions();
	}

	/** Handle window clicks */
	function onWindowClick(): void {
		if (popupElement?.open) return;
		else close();
	}

	/** Scroll to option if it is out of view */
	function scrollToOptionIfNeeded(): void {
		const el = options[hovered];
		if (!el || !scrollBox) return;

		const rect = el.parent.getBoundingClientRect();
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
			showOptions();
		}

		const name = this.getAttribute("name")?.toString();
		if (delay) {
			window.clearTimeout(timeout);
			timeout = window.setTimeout(() => {
				if (name) searchValues[name] = this.value;
				else searchValues[DEFAULT_NAME] = this.value;
				updateFilter();
			}, delay);
		} else {
			if (name) searchValues[name] = this.value;
			else searchValues[DEFAULT_NAME] = this.value;
			updateFilter();
		}
	}

	/** TODOC */
	function updateFilter(): void {
		filterOptions = getFilterOptions(searchValues);
	}

	/** Find item based on `HTMLDataElement.value` */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function findItem(value: string): T | null {
		return totalPool.find((item) => `${getKey(item) ?? ""}` === value) ?? null;
	}

	/** Called when the decision has been made to select an option */
	function selectOption(e: Option): void {
		if (multiple) {
			if (e.element.value === CHECK_ALL) {
				const allChecked = options
					.filter((option) => ![CHECK_ALL, UNCHECK_ALL].includes(option.element.value))
					.every((option) => values.includes(getKey(findItem(option.element.value))));

				if (allChecked) values = [];
				else
					values = options
						.filter((option) => ![CHECK_ALL, UNCHECK_ALL].includes(option.element.value))
						.map((option) => getKey(findItem(option.element.value)));
			} else if (e.element.value === UNCHECK_ALL) {
				values = options
					.filter((option) => ![CHECK_ALL, UNCHECK_ALL].includes(option.element.value))
					.map((option) => getKey(findItem(option.element.value)));
			} else {
				const found = getKey(findItem(e.element.value));
				if (!values.includes(found)) values = values.concat(found);
				else values = values.filter((v) => v !== found);
			}
		} else {
			const found = getKey(findItem(e.element.value));
			const oldValue = value;
			value = found;

			// We have to manually update in this case
			if (value === oldValue) {
				updateDisplay(value);
			}

			close();
		}

		hovered = options.findIndex((option) => option === e);
		selectedIndex = hovered;

		// Change must happen after self has been updated
		tick().then(() => dispatch("change", self));
	}

	/** Clear the `search` values */
	function clearSearch(): void {
		Object.keys(searchInputs).forEach((key) => (searchInputs[key].value = ""));
		updateFilter();
	}

	/** Update the `search` element's search value to match current value */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function updateDisplay(value: K | null): void {
		// There is no obvious way to update display when multiple
		if (!multiple) {
			// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
			let item: T | null | undefined;
			if (value === null) {
				item = null;
				selected = null;
			} else {
				item = totalPool.find((o) => getKey(o) === value);

				if (item) selected = item;
				else item = selected;
			}

			Object.keys(searchInputs).forEach((key) => {
				if (key in searchInputs) {
					const ref = searchInputs[key];
					if (key === DEFAULT_NAME) ref.value = `${item ?? ""}`;
					else if (isObject(item)) ref.value = `${item[key] ?? ""}`;
					else ref.value = "";
					searchValues[key] = ref.value;
				}
			});
		}

		updateFilter();
	}

	/** Add `highlighted` class to `hover`d element */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function updateHighlighted(hovered: number, options: Option[]): void {
		for (let i = 0; i < options.length; ++i) {
			const el = options[i];
			if (!el.parent) continue;
			if (i === hovered) el.parent.classList.add("highlighted");
			else el.parent.classList.remove("highlighted");
		}
	}

	/** Handle opening and focusing of this component */
	async function showOptions(): Promise<void> {
		if (!open) {
			open = true;

			if (popup) {
				await popupElement?.showPopup();
				if (popupElement?.innerContainer) {
					// First run is manual
					if (!popupObserver) {
						searchForElements(popupElement.innerContainer, "added");
					}

					popupObserver?.disconnect();
					popupObserver = new MutationObserver(mutationCallback);
					popupObserver.observe(popupElement.innerContainer, { childList: true, subtree: true });

					popupElement.innerContainer.addEventListener("focusin", onFocusIn);
					popupElement.innerContainer.addEventListener("focusout", onFocusOut);
				}
			}

			focused = true;
			selectedIndex = hovered;

			await tick();

			// Clear search inputs inside the popup
			Object.keys(searchInputs)
				.filter((key) => popupElement?.innerContainer?.contains(searchInputs[key]))
				.forEach((key) => {
					searchValues[key] = "";
					searchInputs[key].value = "";
				});
		} else {
			selectedIndex = hovered;
		}

		updateFilter();
		searchForOptions();
		scrollToOptionIfNeeded();
	}

	/** Handle opening and focusing of this component */
	function close(): void {
		if (!open) return;
		open = false;

		// Cleanup popup stuff
		if (popup) {
			Object.keys(searchInputs).forEach((key) => {
				if (popupElement?.innerContainer?.contains(searchInputs[key])) delete searchInputs[key];
			});
			scrollBox = null;
			popupElement?.close();
			popupObserver?.disconnect();
			popupObserver = null;
		}
	}

	/** Update option array */
	function searchForOptions(): void {
		const parent = popupElement?.innerContainer ?? container;
		if (!parent) return;

		const dataEls = Array.from(parent.querySelectorAll("data"));
		for (const dataEl of dataEls) {
			// TOTHINK: We could maybe to slices, but then it won't work with #key blocks
			if (options.some((option) => option.element === dataEl)) continue;

			const parent = PopupHelper.findParentWithDisplay(dataEl.parentElement);
			if (!parent || parent === dataEl) continue;

			parent.addEventListener("click", onClick);
			parent.addEventListener("mouseover", onMouseover);
			parent.addEventListener("mouseout", onMouseout);

			options.push({ element: dataEl, parent });
		}

		options = options.filter((option) => dataEls.includes(option.element));
		tick().then(checkHoverOverflow);
	}

	/** Handle `search` element click */
	function onClick(this: HTMLDataElement): void {
		const option = options.find((o) => o.parent === this);
		if (!option) return;
		selectOption(option);
	}

	/** Handle `search` element mouseover */
	function onMouseover(e: Event): void {
		if (!(e.target instanceof HTMLElement)) return;
		hovered = options.findIndex((o) => o.parent === e.currentTarget);
	}

	/** Handle `search` element mouseout */
	function onMouseout(): void {
		hovered = selectedIndex;
	}

	/** Handle component focus */
	function onFocusIn(): void {
		focused = true;
		if (showOnFocus) showOptions();
	}

	/** Handle component blur */
	function onFocusOut(e: FocusEvent): void {
		if (
			e.relatedTarget &&
			e.relatedTarget instanceof HTMLElement &&
			(container?.contains(e.relatedTarget) || popupElement?.innerContainer?.contains(e.relatedTarget))
		) {
			return;
		}

		focused = false;
		close();

		// If ´force´, check if values are valid and if not, revert
		if (!force && !multiple) return;

		// First try to find based on search
		const option = getOptionMatchingSearch(searchValues);

		// If not found, do not change value and explicitly revert display
		if (!option) {
			updateDisplay(value);
		} else {
			const oldValue = getKey(option);
			if (value === oldValue) updateDisplay(value);
			else value = oldValue;
		}
	}

	/** Get the option fully matching search strings */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function getOptionMatchingSearch(search: Record<string, string>): T | null {
		return (
			totalPool.find((item) => {
				if (isObject(item)) return Object.keys(search).every((key) => search[key].toLowerCase() === `${ensureObject(item)[key]}`.toLowerCase());
				return search[DEFAULT_NAME]?.toLowerCase() === `${item}`.toLowerCase();
			}) ?? null
		);
	}

	/** Check if the currently `hovered` option gone from view */
	function checkHoverOverflow(): void {
		const last = options.filter((option) => !!option).length - 1;
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
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function getFilterOptions(search: Record<string, string>): (pool: T[], allOnEmpty?: boolean) => T[] {
		return (dynamicPool, allOnEmpty) => {
			// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
			totalPool = dynamicPool.concat(pool).reduce<T[]>((acc, curr) => {
				if (!acc.some((item) => getKey(item) === getKey(curr))) acc.push(curr);
				return acc;
			}, []);

			// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
			let filtered: T[] = [];

			// First check if the search matches completely and is the current value. In this case, displaying only the option that is already selected doesn't provide much utility
			const option = getOptionMatchingSearch(search);
			if (isObject(option) && Object.keys(search).every((key) => search[key].toLowerCase() === `${ensureObject(option)[key]}`.toLowerCase())) {
				filtered = Array.from(dynamicPool);
			} else if (`${option}`.toLowerCase() === search[DEFAULT_NAME]?.toLowerCase()) {
				filtered = Array.from(dynamicPool);
			} else {
				// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
				filtered = Object.keys(search).reduce<T[]>(
					(prev, curr) =>
						prev.filter((item) => {
							const val = search[curr].toLowerCase();
							if (!val) return allOnEmpty !== false; // If no search, display all
							return isObject(item) ? `${item[curr]}`.toLowerCase().includes(val) : `${item}`.toLowerCase().includes(val);
						}),
					Array.from(dynamicPool)
				);
			}

			// Check if selectedIndex is still in range
			tick().then(searchForOptions);
			return filtered;
		};
	}

	/** Check if all pool options are contained in `values` */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function updateAllChecked(pool: T[], values: (K | null)[]): boolean {
		return pool.filter((o) => !!o).every((o) => values.includes(getKey(o)));
	}

	/** TODOC */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function getChecked(values: (K | null)[]): T[] {
		// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
		return values.reduce<T[]>((prev, curr) => {
			let found = totalPool.find((item) => getKey(item) === curr);
			// Pool could have changed since last time, so source from checked as well if not found in pool
			found ??= checked.find((item) => getKey(item) === curr);
			if (found) prev.push(found);
			return prev;
		}, []);
	}

	/** TODOC */
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	function uncheck(item: T): void {
		values = values.filter((value) => getKey(item) !== value);
	}

	// Update highlighted option when options and hovered changes
	$: updateHighlighted(hovered, options);

	// Update display when value changes
	$: updateDisplay(value);

	// Update references to checked items
	$: checked = getChecked(values);

	// Update `allChecked` when options and values changes
	$: allChecked = updateAllChecked(totalPool, values);
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
	<slot
		name="summary"
		{clearSearch}
		{container}
		{allChecked}
		{open}
		{value}
		{values}
		{searchValues}
		{selected}
		{checked}
		checkAll={CHECK_ALL}
		uncheckAll={UNCHECK_ALL}
		{uncheck} />
	{#if !popup}
		<slot
			{filterOptions}
			{clearSearch}
			{container}
			{allChecked}
			{open}
			{value}
			{values}
			{searchValues}
			{selected}
			{checked}
			checkAll={CHECK_ALL}
			uncheckAll={UNCHECK_ALL}
			{uncheck} />
	{/if}
</div>
{#if popup}
	<Popup bind:self={popupElement} anchor={container} {modalSmall} align="stretch" contain on:close={close}>
		<slot
			{filterOptions}
			{clearSearch}
			{container}
			{allChecked}
			{open}
			{value}
			{values}
			{searchValues}
			{selected}
			{checked}
			checkAll={CHECK_ALL}
			uncheckAll={UNCHECK_ALL}
			{uncheck} />
	</Popup>
{/if}

<style lang="scss">
	.contents {
		display: contents;
	}
</style>
