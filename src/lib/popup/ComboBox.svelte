<script lang="ts" generics="T, K = string">
	import { onDestroy, onMount } from "svelte";
	import { SelectHelper } from "$lib/select/index.js";

	export let value: K | undefined = void 0;
	export let name = "";
	export let selected: T[] = [];
	export let search: (inputs: Record<string, string>) => T[] = () => [];

	let container: HTMLDivElement | undefined;
	let open = false;
	let observer: MutationObserver | null = null;
	let display = "";
	let inputs: Record<string, string> = {};
	let valueLastSubmit: K | undefined = void 0;

	onMount(() => {
		if (!container) return;
		observer = new MutationObserver(mutationCallback);
		observer.observe(container, { subtree: true, childList: true });
		const existing = container.querySelectorAll("*");
		for (const element of existing) {
			handleElement(element, "added");
		}
	});

	onDestroy(() => {
		observer?.disconnect();
		observer = null;
	});

	function mutationCallback(mutations: MutationRecord[]): void {
		for (const mutation of mutations) {
			for (const addedNode of mutation.addedNodes) {
				handleElement(addedNode, "added");
			}
			for (const addedNode of mutation.removedNodes) {
				handleElement(addedNode, "removed");
			}
		}
	}

	function handleElement(node: Node, act: "added" | "removed"): void {
		if (node instanceof HTMLDataElement) {
			if (act === "added") {
				node.parentElement?.addEventListener("click", optionClick);
			} else if (act === "removed") {
				node.parentElement?.removeEventListener("click", optionClick);
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
	}

	function optionClick(this: HTMLElement): void {
		console.log(this);
		display = this.innerText;
		value = this.querySelector<HTMLDataElement>("data")?.value as K | undefined;
	}

	function keydown(e: KeyboardEvent): void {
		switch (e.key) {
			case "Enter":
				if (value === valueLastSubmit) return;
				e.preventDefault();
				valueLastSubmit = value;
				break;
		}
	}
</script>

{#if name}
	<input type="hidden" hidden {name} value={value ?? ""} />
{/if}
<div style="display: contents;" bind:this={container} on:keydown={keydown}>
	<slot options={search(inputs)} {open} {display} {value} />
</div>
