<script lang="ts">
	import { outClick } from "$lib/popup/outClick.js";
	import { autoPopup } from "$lib/popup/autoPopup.js";
	import Popup from "$lib/popup/Popup.svelte";

	let open = false;
	let openDd = false;
	let test: HTMLDialogElement;
	$: if (open && test) test.showModal();
	else if (!open && test) test.close();
</script>

<h1>Dialog</h1>

<!--<button popovertarget="mypopover">Toggle the popover</button>-->
<!--<div id="mypopover" popover>Popover content</div>-->

<div style="display: flex; justify-content: space-between; height: 100rem;">
	<button on:click={() => (open = true)}>Open</button>

	<button class="dropbtn" on:click={() => (openDd = true)}>Dropdown</button>
	<Popup class="" open={openDd}>
		<button on:click={() => (openDd = false)}>Option 1</button>
		<button on:click={() => (openDd = false)}>Option 2</button>
		<button on:click={() => (openDd = false)}>Option 3</button>
		<button on:click={() => (openDd = false)}>Option 4</button>
	</Popup>

	<div class="dropdown">
		<button>Dropdown auto</button>
		<div class="dropdown-container" use:autoPopup>
			<div class="dropdown-content">
				<button>Option 1</button>
				<button>Option 2</button>
				<button>Option 3</button>
				<button>Option 4</button>
			</div>
		</div>
	</div>

	<dialog bind:this={test} on:close={() => (open = false)} use:outClick={() => test.close()}>
		<p>Greetings, one and all!</p>
		<input />
		<form method="dialog">
			<button>OK</button>
		</form>
		<button on:click={() => (open = false)}>test</button>
	</dialog>

	<button>Auto</button>
	<dialog use:autoPopup>
		<p>Greetings, one and all!</p>
		<input />
		<form method="dialog">
			<button>OK</button>
		</form>
		<button on:click={() => (open = !open)}>test</button>
	</dialog>
</div>

<h1>Test</h1>

<style lang="scss">
	@use "../../lib/popup/dropdown";

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	dialog {
		width: 98%;
		padding: 1rem;
		box-sizing: border-box;
		background-color: #242425;
		border-radius: 1rem;
		color: white;
		border: 1px solid slategray;
		font-family: sans-serif;
		animation: fade-in forwards 100ms;
		box-shadow: 0.3rem 0.3rem 0.3rem 0.3rem rgba(0, 0, 0, 0.54);
	}

	:global(dialog::backdrop) {
		background-color: rgba(41, 43, 44, 0.2);
		backdrop-filter: blur(1px);
	}
</style>
