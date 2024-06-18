<svelte:options accessors={true} />

<script lang="ts">
	import { PopupHelper } from "$lib/popup/PopupHelper.js";
	import { createEventDispatcher } from "svelte";

	/** TODOC */
	const dispatch = createEventDispatcher<{ show: void; close: void }>();

	/** TODOC */
	export let open = false;

	/** TODOC */
	let _open = false;

	/** TODOC */
	export let backdrop = false;

	/** TODOC */
	export let dismissible = false;

	/** TODOC */
	export let delay = 0;

	/** TODOC */
	export let align: "start" | "end" | "center" = "center";

	/** TODOC */
	export let justify: "start" | "end" | "center" = "center";

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** CSS style for container */
	export let style = "";

	/** TODOC */
	let delayedOpen = _open;

	/** TODOC */
	let closeTimeout = 0;

	$: if (open) showModal();
	else close();

	/** TODOC */
	export function showModal(): void {
		if (_open) {
			return;
		}

		_open = true;
		open = true;
		delayedOpen = true;
		dispatch("show");
	}

	/** TODOC */
	export function close(): void {
		if (!_open) {
			return;
		}

		_open = false;
		open = false;
		if (delay > 0) {
			window.clearTimeout(closeTimeout);
			closeTimeout = window.setTimeout(() => {
				delayedOpen = false;
			}, delay);
		} else {
			delayedOpen = false;
		}
		dispatch("close");
	}

	/** TODOC */
	function keypress(e: KeyboardEvent): void {
		if ((e.key == "Enter" || e.key == "Escape") && _open && dismissible) {
			close();
		}
	}
</script>

{#if backdrop}
	<div
		class="modal-backdrop"
		on:click={() => {
			if (_open && dismissible) close();
		}}
		role="button"
		tabindex="-1"
		on:keypress={keypress}
		style:z-index={PopupHelper.findHighestZIndex() + 1}
		style:display={_open || delayedOpen ? "" : "none"} />
{/if}
<div
	class="modal-container"
	style:justify-content={justify}
	style:align-items={align}
	style:z-index={PopupHelper.findHighestZIndex() + 1}
	style:display={_open || delayedOpen ? "flex" : "none"}>
	<div class={cssClass} style="position: relative; {style}">
		<slot open={_open} {close} {delay} />
	</div>
</div>

<style lang="scss">
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		width: 100vw;
		backdrop-filter: blur(2px);
	}

	.modal-container {
		position: fixed;
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;
	}
</style>
