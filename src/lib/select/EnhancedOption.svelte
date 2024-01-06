<script lang="ts">
	import { onDestroy } from "svelte";
	import type { SvelteEnhancedOptionElement } from "$lib/select/SvelteEnhancedOptionElement.js";

	/** Type of the array element */
	type T = $$Generic;

	// /** Type of the value */
	// type K = $$Generic;

	/** The array element this option represents */
	export let value: T | null = null;

	/** Set to true if this options should toggle all for multiple select */
	export let togglesAll = false;

	/** Pass down from `EnhancedSelect` */
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
	export const self: SvelteEnhancedOptionElement<T> = {
		value,
		element: container,
		togglesAll,
		checked,
		setChecked(value) {
			checked = value;
		}
	};

	// Update self
	$: self.value = value;
	$: self.element = container;
	$: self.togglesAll = togglesAll;
	$: self.checked = checked;

	// Call register option when available
	$: registerOption(self);

	// cleanup
	onDestroy(() => {
		self.element = null;
	});
</script>

<div bind:this={container} class={cssClass} {style}>
	<slot {checked}>&nbsp;</slot>
</div>
