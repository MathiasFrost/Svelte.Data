<svelte:options accessors={true} />

<script lang="ts">
	import Accordion from "$lib/popup/Accordion.svelte";
	import { slide } from "svelte/transition";

	/** TODOC */
	export let open = false;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** CSS style for container */
	export let style = "";

	/** TODOC */
	export function showCollapse(): void {
		open = true;
	}

	/** TODOC */
	export function close(): void {
		open = false;
	}
</script>

<Accordion class={cssClass} {style} bind:open delay={300} let:delay let:open on:show on:close>
	<svelte:fragment slot="summary">
		<slot name="summary" />
	</svelte:fragment>
	{#if open}
		<div transition:slide={{ duration: delay }} on:introend on:outroend>
			<slot />
		</div>
	{/if}
</Accordion>
