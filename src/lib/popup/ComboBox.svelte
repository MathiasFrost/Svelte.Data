<script lang="ts" generics="T">
	import { onDestroy, onMount } from "svelte";
	import { PopupHelper } from "$lib/popup/PopupHelper.js";

	export let value = "";
	export let name = "";
	export let selected: T[] = [];
	export let search: (inputs: Record<string, string>) => T[] = () => [];

	let container: HTMLDivElement | undefined;
	let open = false;
	let observer: MutationObserver | null = null;
	let display = "";
	let inputs: Record<string, string> = {};

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
</script>

<svelte:document on:click={documentClick} on:keydown={documentKeydown} />

{#if name}
	<input type="hidden" hidden {name} value={value ?? ""} />
{/if}
<div style="display: contents;" bind:this={container} on:keydown={keydown} on:click={onClick} on:focusin={focusIn} on:focusout={focusOut}>
	<slot options={search(inputs)} {open} {display} {value} />
</div>
