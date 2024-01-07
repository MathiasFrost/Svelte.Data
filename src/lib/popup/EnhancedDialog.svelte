<script lang="ts">
	import { portalIn } from "$lib/popup/portal.js";

	/** TODOC */
	export let open = false;

	/** TODOC */
	export let dismissible = true;

	/** Set to true to automatically set up click events on the slot elements */
	export let auto = false;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** TODOC */
	function keypress(e: KeyboardEvent): void {
		if ((e.key == "Enter" || e.key == "Escape") && dismissible) {
			open = false;
		}
	}

	/** TODOC */
	function handleClick(): void {
		if (auto) open = !open;
	}
</script>

{#if auto && $$slots["default"]}
	<div class="passthrough" on:click={handleClick} role="button" tabindex="-1" on:keyup={handleClick}>
		<slot />
	</div>
{/if}
{#if open}
	<div use:portalIn={"modal"}>
		<div class="modal-backdrop" on:click={() => (open = dismissible ? false : open)} role="button" tabindex="-1" on:keypress={keypress} />
		<div class="modal-container">
			<div class="modal {cssClass}">
				{#if $$slots["body"]}
					<slot name="body" />
				{:else}
					<slot />
				{/if}
			</div>
		</div>
	</div>
{/if}

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
		top: 0;
		left: 0;
		height: 100vh;
		width: 100vw;
		display: flex;
		pointer-events: none;
		justify-content: center;
		align-items: center;
	}

	.modal {
		pointer-events: all;
		overflow: hidden;
		max-width: 93vw; // Modal should never take up the whole screen
		max-height: 93vh;
		overscroll-behavior-y: contain;

		// Mobile browsers sometimes have an annoying bottom and upper strip that is overlayed on top of the window itself, hiding it without the possibility of scrolling
		@media (width <= 600px) and (orientation: portrait) {
			max-height: 73vh;
			margin-bottom: 3rem;
		}
	}
</style>
