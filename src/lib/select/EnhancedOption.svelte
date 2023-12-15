<script lang="ts">
	import { onDestroy } from "svelte";
	import type { HTMLEnhancedOptionElement } from "$lib/select/HTMLEnhancedOptionElement";

	/** TODOC */
	type T = $$Generic;

	/** TODOC */
	type K = $$Generic;

	/** TODOC */
	export let value: K | null = null;

	/** TODOC */
	export let item: T | null = null;

	/** TODOC */
	export let togglesAll = false;

	/** TODOC */
	export let registerOption: (option: HTMLEnhancedOptionElement<T, K>) => void;

	/** TODOC */
	let container: HTMLDivElement | null = null;

	/** TODOC */
	let checked = false;

	/** TODOC */
	export const self: HTMLEnhancedOptionElement<T, K> = {
		value,
		element: container,
		item,
		togglesAll,
		checked,
		setChecked(value) {
			checked = value;
		}
	};

	// Update self
	$: self.value = value;
	$: self.element = container;
	$: self.item = item;
	$: self.togglesAll = togglesAll;
	$: self.checked = checked;

	// TODOC
	$: registerOption(self);

	// cleanup
	onDestroy(() => {
		self.element = null;
	});
</script>

<div bind:this={container}>
	<slot {checked}>&nbsp;</slot>
</div>
