<script lang="ts">
	let open = false;
	let openDd = false;
	let test: HTMLDialogElement;
	$: if (open && test) test.showModal();
	else if (!open && test) test.close();

	// interface User {
	// 	id: number;
	// 	username: string;
	// 	name: string;
	// }

	// const users: User[] = [
	// 	{ id: 24, username: "ML", name: "Mathias" },
	// 	{ id: 32, username: "OPB", name: "Ola" },
	// 	{ id: 42, username: "ADr", name: "Andre" },
	// 	{ id: 52, username: "HMRL", name: "Harald" },
	// 	{ id: 62, username: "JML", name: "Josefine" },
	// 	{ id: 72, username: "MIR", name: "Miriam" }
	// ];
</script>

<h1>Dialog</h1>

<!--<button popovertarget="mypopover">Toggle the popover</button>-->
<!--<div id="mypopover" popover>Popover content</div>-->

<div style="display: flex; justify-content: space-between;">
	<button on:click={() => (open = true)}>Open</button>

	<div class="dropdown right-dropdown">
		<button class="dropbtn" on:click={() => (openDd = true)}>Dropdown</button>
		<div class="dropdown-content" class:open={openDd}>
			<button on:click={() => (openDd = false)}>Option 1</button>
			<button on:click={() => (openDd = false)}>Option 2</button>
			<button on:click={() => (openDd = false)}>Option 3</button>
			<button on:click={() => (openDd = false)}>Option 4</button>
		</div>
	</div>

	<dialog bind:this={test} on:close={() => (open = false)}>
		<p>Greetings, one and all!</p>
		<form method="dialog">
			<button>OK</button>
		</form>
		<button on:click={() => (open = false)}>test</button>
	</dialog>
</div>

<h1>Test</h1>

<style>
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
		animation: fade-in forwards 200ms;
		box-shadow: 0.3rem 0.3rem 0.3rem 0.3rem rgba(0, 0, 0, 0.54);
	}

	:global(dialog::backdrop) {
		background-color: rgba(41, 43, 44, 0.2);
		backdrop-filter: blur(1px);
	}

	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropbtn {
		background-color: #3498db;
		color: white;
		padding: 16px;
		font-size: 16px;
		border: none;
		cursor: pointer;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		background-color: #f9f9f9;
		min-width: 160px;
		box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
		z-index: 1;
		max-height: 200px; /* Adjust as needed */
		overflow: auto; /* Scrollbar will appear if content overflows */
		margin: 0.3rem;
	}

	.dropdown-content button {
		color: black;
		padding: 12px 16px;
		text-decoration: none;
		display: block;
	}

	.dropdown-content button:hover {
		background-color: #f1f1f1;
	}

	/*.dropdown.hover:hover .dropdown-content {*/
	/*	display: block;*/
	/*}*/

	.dropdown-content.open {
		display: block;
	}

	/* For left-aligned dropdown */
	.right-dropdown .dropdown-content {
		right: 0;
		/*right: 100%*/
	}
</style>
