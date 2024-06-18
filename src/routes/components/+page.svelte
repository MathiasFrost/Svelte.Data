<script lang="ts">
	import Collapse from "$lib/components/Collapse.svelte";
	import Popover from "$lib/components/Popover.svelte";

	let popover: Popover | undefined;
	let dialog: HTMLDialogElement | undefined;
</script>

<h2><code>&lt;details&gt;</code></h2>
<details class="card">
	<summary class="card-header">Card Header</summary>
	<div class="card-body">
		<p>This is the content of the card. It will be displayed when the card is expanded.</p>
	</div>
</details>

<h2><code>&lt;Collapse&gt;</code></h2>
<Collapse
	class="card"
	on:show={() => console.log("show")}
	on:introend={() => console.log("introend")}
	on:close={() => console.log("close")}
	on:outroend={() => console.log("outroend")}>
	<div slot="summary" class="card-header">Card Header</div>
	<div class="card-body">
		<p>This is the content of the card. It will be displayed when the card is expanded.</p>
	</div>
</Collapse>

<h2><code>&lt;dialog&gt;</code></h2>
<button type="button" on:click={() => dialog?.showModal()}>Show</button>
<dialog bind:this={dialog} class="popup" style="align-self: center; justify-self: center;">
	<span class="close">&times;</span>
	<h2>Modal Title</h2>
	<p>This is the content of the modal.</p>
	<form method="dialog">
		<button>Close</button>
	</form>
</dialog>

<h2><code>&lt;Popover&gt;</code></h2>
<button type="button" on:click={() => popover?.showPopover()}>Show</button>
<Popover
	bind:this={popover}
	class="popup"
	let:close
	on:show={() => console.log("show")}
	on:introend={() => console.log("introend")}
	on:close={() => console.log("close")}
	on:outroend={() => console.log("outroend")}>
	<span class="close">&times;</span>
	<h2>Modal Title</h2>
	<p>This is the content of the modal.</p>
	<button on:click={close}>Close</button>
</Popover>

<style lang="scss">
	$card-background: #fff;
	$card-border: #ccc;
	$card-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	$card-radius: 8px;
	$transition-duration: 0.3s;
	$header-background: #f5f5f5;
	$header-color: #333;

	:global(.card) {
		background: $card-background;
		border: 1px solid $card-border;
		border-radius: $card-radius;
		box-shadow: $card-shadow;
		overflow: hidden;
		margin-bottom: 1em;
		transition:
			max-height $transition-duration ease-in-out,
			border $transition-duration ease-in-out;

		&[open] {
			border-color: lighten($card-border, 20%);
		}

		.card-header {
			background: $header-background;
			color: $header-color;
			cursor: pointer;
			padding: 1em;
			border-bottom: 1px solid $card-border;
			font-weight: bold;
			user-select: none;

			&:hover {
				background: darken($header-background, 5%);
			}

			&::-webkit-details-marker {
				display: none;
			}

			&:after {
				content: "\25BC"; // Down arrow
				float: right;
				transition: transform $transition-duration ease-in-out;
			}
		}

		&[open] .card-header:after {
			transform: rotate(-180deg);
		}

		.card-body {
			padding: 1em;
			animation: fade-in $transition-duration ease-in-out;

			@keyframes fade-in {
				from {
					opacity: 0;
				}
				to {
					opacity: 1;
				}
			}
		}
	}

	:global(.popup) {
		background-color: #222222;
		color: #cccccc;
		padding: 0.3rem;
		margin: 0.3rem;
		border-radius: 0.3rem;
	}

	.close {
		position: absolute;
		top: 10px;
		right: 10px;
		font-size: 24px;
		cursor: pointer;
	}

	.close:hover {
		color: #ff0000;
	}
</style>
