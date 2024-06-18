<svelte:options accessors={true} />

<script lang="ts">
	import Modal from "$lib/popup/Modal.svelte";
	import { fade } from "svelte/transition";

	/** TODOC */
	export let open = false;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** CSS style for container */
	export let style = "";

	/** TODOC */
	export let dismissible = true;

	/** TODOC */
	export let align: "start" | "end" | "center" = "center";

	/** TODOC */
	export let justify: "start" | "end" | "center" = "center";

	/** TODOC */
	export function showPopover(): void {
		open = true;
	}

	/** TODOC */
	export function close(): void {
		open = false;
	}
</script>

<Modal backdrop {dismissible} class={cssClass} {style} bind:open {align} {justify} let:open on:close on:show delay={300} let:delay>
	{#if open}
		<div transition:fade={{ duration: delay }} on:introend on:outroend>
			<slot {close} />
		</div>
	{/if}
</Modal>
