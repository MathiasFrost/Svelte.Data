<script lang="ts">
	import { outClick } from "$lib/popup/outClick.js";
	import Popup from "$lib/popup/Popup.svelte";
	import { fly } from "svelte/transition";
	import EnhancedDetails from "$lib/popup/EnhancedDetails.svelte";

	let open = false;
	let test: HTMLDialogElement;
	$: if (open && test) test.showModal();
	else if (!open && test) test.close();
</script>

<h1>Dialog</h1>

<!--<button popovertarget="mypopover">Toggle the popover</button>-->
<!--<div id="mypopover" popover>Popover content</div>-->

<Popup auto open justify="below" align="center" let:closeClick>
	<button slot="summary" class="dropbtn" style="padding: 2rem; margin-right: 1rem; width: 10rem; height: 20rem;">Dropdown</button>
	<div style="background-color: crimson">
		<button on:click={closeClick()}>Option 1</button>
		<button on:click={closeClick()}>Option 2</button>
		<button on:click={closeClick()}>Option 3</button>
		<button on:click={closeClick()}>Option 4</button>
	</div>
</Popup>

<div style="display: flex; justify-content: space-between; height: 100rem; width: 100rem;">
	<Popup auto contain justify="left" align="center" let:closeClick>
		<button slot="summary" class="dropbtn" style="padding: 2rem; margin-right: 1rem;">Dropdown</button>
		<div style="width: 3rem; background-color: crimson; height: 100%;">
			<button on:click={closeClick()}>Option 1</button>
			<button on:click={closeClick()}>Option 2</button>
			<button on:click={closeClick()}>Option 3</button>
			<button on:click={closeClick()}>Option 4</button>
		</div>
	</Popup>

	<button on:click={() => (open = true)}>Open</button>

	<dialog bind:this={test} on:close={() => (open = false)} use:outClick={() => test.close()}>
		<p>Greetings, one and all!</p>
		<input />
		<form method="dialog">
			<button>OK</button>
		</form>
		<button on:click={() => (open = false)}>test</button>
	</dialog>

	<EnhancedDetails let:open let:scrollToEnd>
		<div slot="summary">test</div>
		{#if open}
			<div transition:fly on:introend={scrollToEnd}>
				<h1>haahha</h1>
			</div>
		{/if}
	</EnhancedDetails>

	<button>Auto</button>
	<dialog>
		<p>Greetings, one and all!</p>
		<input />
		<form method="dialog">
			<button>OK</button>
		</form>
		<button on:click={() => (open = !open)}>test</button>
	</dialog>

	<button class="dropbtn" style="padding: 2rem;">Dropdown</button>
	<Popup class="" style="width: 3rem; background-color: crimson; height: 100%;" contain justify="below" align="start" auto="contextmenu" let:closeClick>
		<button on:click={closeClick(() => console.log("click"))}>Option 1</button>
		<button>Option 2</button>
		<button>Option 3</button>
		<button>Option 4</button>
	</Popup>
</div>

<h1>Test</h1>

<style lang="scss">
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
