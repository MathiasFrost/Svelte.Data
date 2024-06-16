<svelte:options accessors={true} />

<script lang="ts" context="module">
	import { PopupHelper } from "$lib/popup/PopupHelper.js";

	export type KeyWithDefault<T> = keyof T | "default";
	export type Inputs<T> = Partial<Record<KeyWithDefault<T>, string>>;

	function dynamicThreshold(distances: number[], numClosest: number) {
		// Sort distances and select the closest 'numClosest' distances
		const sortedDistances = [...distances].sort((a, b) => a - b);
		const closestDistances = sortedDistances.slice(0, numClosest);

		// Calculate the average of the closest distances
		// Set the threshold to be slightly more selective, e.g., average of closest distances
		return closestDistances.reduce((sum, val) => sum + val, 0) / closestDistances.length;
	}

	export function makeDefaultSearcher<T>(pool: T[], numClosest = 3): (inputs: Inputs<T>) => T[] {
		return (inputs) => {
			const distances = pool.map((item) => {
				let a = "";
				let b = "";
				let bFull = "";
				for (const name of Object.keys(inputs) as KeyWithDefault<T>[]) {
					const inputVal = `${inputs[name]}`.toLowerCase();
					const itemVal = (name === "default" ? `${item}` : `${item[name]}`).toLowerCase();
					a += inputVal;

					const index = itemVal.indexOf(inputVal);
					if (index !== -1) b += itemVal.substring(index, index + inputVal.length);
					else b += itemVal.substring(0, inputVal.length);

					bFull += itemVal;
				}

				let score: number;
				if (a === bFull) {
					score = -1;
				} else {
					score = PopupHelper.levenshteinDistance(a, b);
				}
				return score;
			});

			const threshold = dynamicThreshold(distances, numClosest);
			return pool.filter((_, i) => distances[i] <= threshold);
		};
	}
</script>

<script lang="ts" generics="T">
	import { onDestroy, onMount } from "svelte";
	import { indefinitePromise } from "$lib/utils/async.js";

	const toggle = "__TOGGLE__";

	export let value = "";
	export let name = "";
	export let defer = false;
	export let search: ((inputs: Inputs<T>, signal: AbortSignal) => T[] | Promise<T[]>) | undefined = void 0;
	export let delay: number = 0;
	export let values: string[] = [];
	export let multiple = false;
	export let controls = "";
	export let items: (T | Inputs<T>)[] = [];

	let inputs: Inputs<T> = {};
	let container: HTMLDivElement | undefined;
	let open = false;
	let observer: MutationObserver | null = null;
	let lastController: AbortController | null = null;

	let closeOnNextClick = false;
	let index: number | null = null;
	let optionElements: HTMLElement[] = [];
	let prevHighlighted: HTMLElement | null = null;

	let result: T[] = [];
	let promise: Promise<T[]> = indefinitePromise<T[]>();

	const inputElements: Partial<Record<KeyWithDefault<T>, HTMLInputElement>> = {};

	$: debouncedUpdateOptions = debounce(() => updateOptions(), delay);

	$: updateHighlighting(index);

	onMount(() => {
		if (!container) return;
		observer = new MutationObserver(mutationCallback);
		observer.observe(container, { subtree: true, childList: true });
		const existing = container.querySelectorAll("input, data");
		for (const element of existing) {
			handleElement(element, "added");
		}

		for (const name of Object.keys(inputElements) as KeyWithDefault<T>[]) {
			inputs[name] = inputElements[name]!.value;
		}

		if (!defer) {
			updateOptions();
		}
	});

	onDestroy(() => {
		observer?.disconnect();
		observer = null;
		lastController?.abort();
		lastController = null;
	});

	function mutationCallback(mutations: MutationRecord[]): void {
		let anyRemoved = false;
		let anyAdded = false;
		for (const mutation of mutations) {
			for (const addedNode of mutation.addedNodes) {
				handleElement(addedNode, "added");
				anyAdded = true;
			}
			for (const addedNode of mutation.removedNodes) {
				handleElement(addedNode, "removed");
				anyRemoved = true;
			}
		}

		if (anyRemoved) {
			const toRemove: HTMLElement[] = [];
			for (const element of optionElements) {
				if (!document.contains(element)) {
					toRemove.push(element);
				}
			}

			optionElements = optionElements.filter((el) => !toRemove.includes(el));

			if (index !== null && index > optionElements.length - 1) {
				index = optionElements.length - 1;
			}
		}

		if (anyAdded || anyRemoved) {
			const valStr = value ?? "";
			const selected = container?.querySelector<HTMLDataElement>(`data[value="${valStr}"]`)?.parentElement;
			if (selected) {
				const newIndex = optionElements.indexOf(selected);
				if (newIndex === -1) index = null;
				else index = newIndex;
			}
		}
	}

	function handleElement(node: Node, act: "added" | "removed"): void {
		if (node instanceof HTMLDataElement && node.parentElement instanceof HTMLElement) {
			if (act === "added") {
				optionElements.push(node.parentElement);
				node.parentElement.addEventListener("click", optionClick);
			} else if (act === "removed") {
				optionElements.splice(optionElements.indexOf(node.parentElement), 1);
				node.parentElement.removeEventListener("click", optionClick);
			}
		} else if (node instanceof HTMLInputElement && (!optionElements.length || !optionElements[optionElements.length - 1].parentElement?.contains(node))) {
			const name = node.name ? (node.name as keyof T) : "default";
			if (act === "added") {
				node.addEventListener("input", input);
				inputElements[name] = node;
				node.autocomplete = "off";
				inputs[name] = node.value;
			} else if (act === "removed") {
				node.removeEventListener("input", input);
				delete inputElements[name];
				delete inputs[name];
			}
		}
	}

	function input(this: HTMLInputElement): void {
		inputs[this.name ? (this.name as keyof T) : "default"] = this.value;
		if (!open) {
			open = true;
		}

		promise = indefinitePromise<T[]>();
		debouncedUpdateOptions();
	}

	function optionClick(this: HTMLElement): void {
		closeOnNextClick = true;
		selectElement(this);
	}

	function selectElement(element: HTMLElement): void {
		value = element.querySelector<HTMLDataElement>("data")?.value ?? "";

		const options = optionElements
			.map((el) => ({ el: el, data: el.querySelector<HTMLDataElement>("data")! }))
			.filter(({ data }) => data && data.value !== toggle);

		const getRes = (element: HTMLElement): { res: Inputs<T>; el: T | undefined } => {
			const newIndex = options.findIndex((pair) => pair.data.value === element.querySelector<HTMLDataElement>("data")?.value);

			if (newIndex !== -1) {
				index = newIndex;
			}

			const el = typeof index === "number" ? result[index] : void 0;
			const res: Inputs<T> = {};

			if (!Object.keys(inputElements).some((name) => name !== "default")) {
				if (inputElements["default"]) res["default"] = element.textContent ?? "";
			} else if (typeof el === "undefined") {
				for (const name of Object.keys(inputElements) as KeyWithDefault<T>[]) {
					if (name === "default") res[name] = element.textContent ?? "";
					else res[name] = element.textContent ?? "";
				}
			} else {
				for (const name of Object.keys(inputElements) as KeyWithDefault<T>[]) {
					if (name === "default") res[name] = `${el ?? ""}`;
					else res[name] = `${el?.[name] ?? ""}`;
				}
			}

			return { res, el };
		};

		const { res, el } = getRes(element);
		if (!multiple) {
			for (const name of Object.keys(res) as KeyWithDefault<T>[]) {
				if (name in inputElements) inputElements[name]!.value = res[name]!;
			}
		} else {
			if (value === toggle) {
				const newValues = options.map((pair) => pair.data.value ?? "").filter((val) => !!val);
				if (newValues.every((val) => values.includes(val))) {
					const resVal: string[] = [];
					const resItem: (T | Inputs<T>)[] = [];
					for (let i = 0; i < values.length; i++) {
						if (newValues.includes(values[i])) continue;
						resVal.push(values[i]);
						resItem.push(items[i]);
					}
					values = resVal;
					items = resItem;
				} else {
					values = values.concat(newValues);
					items = items.concat(options.map((pair) => getRes(pair.el)).map((pair) => pair.el ?? pair.res));
				}
			} else if (!values.includes(value)) {
				values = values.concat(value);
				items = el ? items.concat(el) : items.concat({ ...res });
			} else {
				const index = values.indexOf(value);
				values.splice(index, 1);
				items.splice(index, 1);
				values = values;
				items = items;
			}
		}
	}

	function updateHighlighting(index: number | null): void {
		if (prevHighlighted) prevHighlighted.classList.remove("highlighted");
		if (index === null) {
			prevHighlighted = null;
			return;
		}

		optionElements[index].classList.add("highlighted");
		prevHighlighted = optionElements[index];
	}

	function keydown(e: KeyboardEvent): void {
		switch (e.key) {
			case "Enter":
				if (open) {
					e.preventDefault();
					if (!multiple && index !== null && optionElements.length) {
						selectElement(optionElements[index]);
					}
					open = false;
				}
				break;
			case " ":
				if (multiple && open && e.ctrlKey && index !== null && optionElements.length) {
					e.preventDefault();
					selectElement(optionElements[index]);
				} else if (!open && e.ctrlKey) {
					e.preventDefault();
					open = true;
				}
				break;
			case "ArrowUp":
				if (!open) {
					open = true;
				}
				e.preventDefault();
				if (index === null) {
					index = optionElements.length - 1;
				} else if (index > 0) {
					index--;
				} else {
					index = null;
				}

				break;
			case "ArrowDown":
				if (!open) {
					open = true;
				}
				e.preventDefault();
				if (index === null) {
					index = 0;
				} else if (index < optionElements.length - 1) {
					index++;
				} else {
					index = null;
				}

				break;
		}
	}

	function focusIn(): void {}

	async function focusOut(e: FocusEvent): Promise<void> {
		if (!e.relatedTarget) {
			return;
		}

		if (e.relatedTarget instanceof Node && container?.contains(e.relatedTarget)) {
			return;
		}

		if (open) {
			open = false;
		}
	}

	function onClick(): void {
		if (closeOnNextClick && !multiple) {
			open = false;
		} else if (!open) {
			open = true;
		}
		closeOnNextClick = false;
	}

	function documentClick(e: MouseEvent): void {
		if (!PopupHelper.isOutsideClick(e, container)) return;
		open = false;
	}

	function documentKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && open) {
			e.preventDefault();
			open = false;
		}
	}

	async function updateOptions(): Promise<void> {
		if (search) {
			lastController?.abort();
			const controller = new AbortController();
			lastController = controller;
			try {
				const maybePromise = search(inputs, controller.signal);
				if (maybePromise instanceof Promise) {
					promise = maybePromise;
					const res = await promise;
					if (!controller.signal.aborted) {
						result = res;
					}
				} else {
					result = maybePromise;
				}
			} finally {
				lastController = null;
			}
		}
	}

	function debounce(func: (...args: unknown[]) => void, wait: number): typeof func {
		let timeout: number | undefined;

		return function executedFunction(...args: unknown[]) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};

			clearTimeout(timeout);
			timeout = window.setTimeout(later, wait);
		};
	}

	$: if (defer && open) {
		updateOptions();
	}

	function allSelected(options: HTMLElement[], values: string[]): boolean {
		return options
			.map((element) => element.querySelector<HTMLDataElement>("data")?.value ?? "")
			.filter((val) => val !== toggle)
			.every((val) => values.includes(val));
	}

	interface Selection<T> {
		readonly selected: {
			/** If `<data>` elements are created dynamically from `search` */
			asT(): T[];

			/** If `<data>` elements are created manually with no matching element from `search` */
			asInputs(): Inputs<T>[];
		};
		readonly all: boolean;
		deselect(value: string): void;
		readonly toggle: string;
	}

	function makeSelection(its: (T | Inputs<T>)[], options: HTMLElement[], vals: string[]): Selection<T> {
		return {
			toggle,
			all: allSelected(options, vals),
			deselect(value: string) {
				const index = values.indexOf(value);
				values.splice(index, 1);
				items.splice(index, 1);
				values = values;
				items = items;
			},
			selected: {
				asT(): T[] {
					return its as T[];
				},
				asInputs(): Inputs<T>[] {
					return its as Inputs<T>[];
				}
			}
		};
	}
</script>

<svelte:document on:click={documentClick} on:keydown={documentKeydown} />

{#if name}
	{#if multiple}
		<select hidden {name} multiple>
			{#each values as value}
				<option selected {value} />
			{/each}
		</select>
	{:else}
		<input type="hidden" hidden {name} value={value ?? ""} />
	{/if}
{/if}
<div
	style="display: contents;"
	tabindex="-1"
	role="combobox"
	aria-expanded={open}
	aria-controls={controls}
	bind:this={container}
	on:keydown={keydown}
	on:click={onClick}
	on:focusin={focusIn}
	on:focusout={focusOut}>
	<slot {result} {open} {value} {promise} {values} {items} selection={makeSelection(items, optionElements, values)} />
</div>
