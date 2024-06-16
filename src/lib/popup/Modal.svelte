<svelte:options accessors={true} />

<script lang="ts">
	/** TODOC */
	export let open = false;

	/** TODOC */
	export let dismissible = true;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** TODOC */
	export function close() {
		open = false;
	}

	/** TODOC */
	export function showModal() {
		open = true;
	}

	/** TODOC */
	function keypress(e: KeyboardEvent): void {
		if ((e.key == "Enter" || e.key == "Escape") && dismissible) {
			open = false;
		}
	}
</script>

{#if open}
	<div class="modal-backdrop" on:click={() => (open = dismissible ? false : open)} role="button" tabindex="-1" on:keypress={keypress} />
	<div class="modal-container">
		<div class="modal {cssClass}">
			<slot />
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
