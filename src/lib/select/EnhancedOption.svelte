<script lang="ts" generics="T">
	import { onDestroy } from "svelte";
	import type { SvelteEnhancedOptionElement } from "$lib/select/SvelteEnhancedOptionElement.js";

	/** The array element this option represents */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let item: T | null = null;

	/** Set to true if this options should toggle all for multiple select */
	export let togglesAll = false;

	/** Pass down from `EnhancedSelect` */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export let registerOption: (option: SvelteEnhancedOptionElement<T>) => void;

	/** CSS class for container */
	let cssClass = "";
	export { cssClass as class };

	/** CSS style for container */
	export let style = "";

	/** Container for the option */
	let container: HTMLDivElement | null = null;

	/** Passed down to slot as a convenient way to conditionally render something based on multiple `EnhancedSelect`'s values */
	let checked = false;

	/** @see SvelteEnhancedOptionElement */
	// TODOE: REMOVE WHEN https://github.com/sveltejs/svelte-eslint-parser/issues/306 IS FIXED
	// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
	export const self: SvelteEnhancedOptionElement<T> = {
		get item() {
			return item;
		},
		get element() {
			return container;
		},
		get togglesAll() {
			return togglesAll;
		},
		get checked() {
			return checked;
		},
		setChecked(value) {
			checked = value;
		}
	};

	// cleanup
	onDestroy(() => {
		container = null;
	});

	// Call register option when available
	$: if (container) registerOption(self);
</script>

<div bind:this={container} class={cssClass} {style}>
	<slot {checked}>&nbsp;</slot>
</div>
