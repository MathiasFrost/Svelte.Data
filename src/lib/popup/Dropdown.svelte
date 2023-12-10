<script lang="ts" context="module">
	/** TODOC */
	export interface DropdownController {
		/** TODOC */
		showDropdown(): void;

		/** TODOC */
		close(): void;
	}
</script>

<script lang="ts">
	import { tick } from "svelte";
	import { outClick } from "$lib/popup/outClick.js";

	/** TODOC */
	export let open = false;

	/** TODOC */
	export let focus: HTMLElement | null = null;

	/** TODOC */
	export let reFocus: HTMLElement | null = null;

	/** TODOC */
	export const dropdown: DropdownController = {
		showDropdown() {
			open = true;
			tick().then(() => focus?.focus());
			window.addEventListener("keyup", onKeyup);
		},
		close() {
			open = false;
			window.removeEventListener("keyup", onKeyup);
			reFocus?.focus();
		}
	};

	/** TODOC */
	function onKeyup(e: KeyboardEvent): void {
		switch (e.key) {
			case "Escape":
			case "Enter":
				dropdown.close();
				break;
		}
	}
</script>

<div class="dropdown right">
	<button type="button" class="btn-subtle" on:click={dropdown.showDropdown}>
		<slot />
	</button>
	<div class="dropdown-content card" class:open use:outClick={dropdown.close}>
		<slot name="content" />
	</div>
</div>
