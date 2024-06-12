<script lang="ts" context="module">
	import { SelectHelper } from "$lib/select/index.js";

	export function getDefaultSearcher<T>(pool: T[]): (inputs: Record<string, string>) => T[] {
		return (inputs) => {
			return pool.filter((item) => {
				return (
					Object.keys(inputs).reduce((prev, curr) => {
						if (!inputs[curr]) return 0;
						return prev + SelectHelper.levenshteinDistance(inputs[curr], JSON.stringify(item));
					}, 0) < 25
				);
			});
		};
	}
</script>

<script lang="ts" generics="T">
	import { onDestroy, onMount } from "svelte";
	import { PopupHelper } from "$lib/popup/PopupHelper.js";
	import { indefinitePromise } from "$lib/async/index.js";

	export let value = "";
	export let name = "";
	export let selected: T[] = [];
	export let getOptions: ((inputs: Record<string, string>) => T[]) | undefined = void 0;
	export let getOptionsAsync: ((inputs: Record<string, string>, signal: AbortSignal) => Promise<T[]>) | undefined = void 0;

	let container: HTMLDivElement | undefined;
	let open = false;
	let observer: MutationObserver | null = null;
	let display = "";
	let inputs: Record<string, string> = {};
	let lastController: AbortController | null = null;

	let closeOnNextClick = false;
	let index: number | null = null;
	let optionElements: HTMLElement[] = [];
	let prevHighlighted: HTMLElement | null = null;

	$: updateHighlighting(index);

	onMount(() => {
		if (!container) return;
		observer = new MutationObserver(mutationCallback);
		observer.observe(container, { subtree: true, childList: true });
		const existing = container.querySelectorAll("input, data");
		for (const element of existing) {
			handleElement(element, "added");
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
			if (act === "added") {
				node.addEventListener("input", input);
			} else if (act === "removed") {
				node.removeEventListener("input", input);
			}
		}
	}

	function input(this: HTMLInputElement): void {
		inputs[this.name] = this.value;
		if (!open) {
			open = true;
		}
	}

	function optionClick(this: HTMLElement): void {
		closeOnNextClick = true;
		selectElement(this);
	}

	function selectElement(element: HTMLElement): void {
		display = element.innerText;
		value = element.querySelector<HTMLDataElement>("data")?.value ?? "";
		index = optionElements.indexOf(element);
		inputs = Object.keys(inputs).reduce((prev, curr) => ({ ...prev, [curr]: "" }), {});
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

	let submitNext = false;

	function keydown(e: KeyboardEvent): void {
		switch (e.key) {
			case "Enter":
				if (open) {
					e.preventDefault();
					if (index !== null && optionElements.length) {
						selectElement(optionElements[index]);
					}
					open = false;
					submitNext = true;
				} else if (submitNext) {
					submitNext = false;
				} else {
					e.preventDefault();
					open = true;
				}
				break;
			case "ArrowUp":
				if (!open) return;
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
				if (!open) return;
				e.preventDefault();
				if (index === null) {
					index = 0;
				} else if (index < optionElements.length - 1) {
					index++;
				} else {
					index = null;
				}

				break;
			case " ":
				if (!open && e.ctrlKey) {
					e.preventDefault();
					open = true;
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

	let options: T[] = [];
	let optionsPromise: Promise<T[]> = indefinitePromise<T[]>();

	function updateOptions(getOptions: ((inputs: Record<string, string>) => T[]) | undefined, inputs: Record<string, string>): void {
		if (getOptions) {
			options = getOptions(inputs);
		}
	}

	async function updateAsyncOptions(
		open: boolean,
		getOptionsAsync: ((inputs: Record<string, string>, signal: AbortSignal) => Promise<T[]>) | undefined,
		inputs: Record<string, string>
	): Promise<void> {
		if (getOptionsAsync && open) {
			lastController?.abort();
			const controller = new AbortController();
			lastController = controller;
			optionsPromise = getOptionsAsync(inputs, controller.signal);
			try {
				const res = await optionsPromise;
				if (!controller.signal.aborted) {
					options = res;
				}
			} catch (e) {
				console.error(e);
			}

			lastController = null;
		}
	}

	$: updateOptions(getOptions, inputs);
	$: updateAsyncOptions(open, getOptionsAsync, inputs);
</script>

<svelte:document on:click={documentClick} on:keydown={documentKeydown} />

{#if name}
	<input type="hidden" hidden {name} value={value ?? ""} />
{/if}
<div style="display: contents;" bind:this={container} on:keydown={keydown} on:click={onClick} on:focusin={focusIn} on:focusout={focusOut}>
	<slot {options} {open} {display} {value} {optionsPromise} />
</div>
