<svelte:options accessors={true} />

<script lang="ts" context="module">
	import { PopupHelper } from "$lib/popup/PopupHelper.js";

	export function makeDefaultSearcher<T>(pool: T[], threshold = 3): (inputs: Partial<Record<keyof T | "default", string>>) => T[] {
		return (inputs) => {
			let hasExactMatch: Partial<Record<keyof T | "default", boolean>> = Object.keys(inputs).reduce((prev, curr) => ({ ...prev, [curr]: false }), {});
			const firstRound = pool.filter((item) => {
				if ((Object.keys(hasExactMatch) as (keyof T | "default")[]).every((name) => hasExactMatch[name])) {
					return false;
				}

				const score = (Object.keys(inputs) as (keyof T | "default")[]).reduce((prev, curr) => {
					if (!inputs[curr]) {
						return 0;
					}

					let score = 0;
					if (curr === "default") score = prev + PopupHelper.likenessScore(inputs[curr]!, `${item}`);
					else score = prev + PopupHelper.likenessScore(inputs[curr]!, `${item[curr]}`);

					hasExactMatch[curr] = score === -1;

					return score;
				}, 0);

				return score < threshold;
			});

			if ((Object.keys(hasExactMatch) as (keyof T | "default")[]).every((name) => hasExactMatch[name])) {
				return pool;
			}

			return firstRound;
		};
	}
</script>

<script lang="ts" generics="T">
	import { onDestroy, onMount } from "svelte";
	import { indefinitePromise } from "$lib/utils/async.js";

	type Inputs = Partial<Record<keyof T | "default", string>>;

	export let value = "";
	export let name = "";
	export let defer = false;
	export let search: ((inputs: Inputs, signal: AbortSignal) => T[] | Promise<T[]>) | undefined = void 0;
	export let delay: number = 0;
	export let values: string[] = [];
	export let multiple = false;
	export let controls = "";
	export let valuesText: Inputs[] = [];

	let inputs: Inputs = {};
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

	const inputElements: Partial<Record<keyof T | "default", HTMLInputElement>> = {};

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

		for (const name of Object.keys(inputElements) as (keyof T | "default")[]) {
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
		} else if (node instanceof HTMLInputElement) {
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
		index = optionElements.indexOf(element);

		const offset = optionElements.length - result.length;
		const realIndex = index - offset;

		const el = result[realIndex];
		const res: Inputs = {};
		if (!Object.keys(inputElements).some((name) => name !== "default")) {
			if (inputElements["default"]) res["default"] = element.textContent ?? "";
		} else if (typeof el === "undefined") {
			for (const name of Object.keys(inputElements) as (keyof T | "default")[]) {
				if (name === "default") res[name] = element.textContent ?? "";
				else res[name] = element.textContent ?? "";
			}
		} else {
			for (const name of Object.keys(inputElements) as (keyof T | "default")[]) {
				if (name === "default") res[name] = `${el ?? ""}`;
				else res[name] = `${el?.[name] ?? ""}`;
			}
		}

		for (const name of Object.keys(res) as (keyof T | "default")[]) {
			if (name in inputElements) inputElements[name]!.value = res[name]!;
		}

		if (multiple) {
			if (!values.includes(value)) {
				values = values.concat(value);
				valuesText = valuesText.concat({ ...res });
			} else {
				const index = values.indexOf(value);
				values.splice(index, 1);
				valuesText.splice(index, 1);
				values = values;
				valuesText = valuesText;
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
		if (closeOnNextClick) {
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

	function isAllToggled(options: HTMLElement[], values: string[]): boolean {
		return options
			.map((element) => element.querySelector<HTMLDataElement>("data")?.value ?? "")
			.filter((val) => !!val)
			.every((val) => values.includes(val));
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
	<slot {result} {open} {value} {promise} {values} {valuesText} all={isAllToggled(optionElements, values)} />
</div>
