<script lang="ts">
	import { PopupHelper } from "$lib/popup/PopupHelper.js";
	import { onMount, tick } from "svelte";

	let container: HTMLDivElement | undefined;

	let above: Element | undefined;

	let dialog: HTMLDialogElement | undefined;

	export let open = false;

	export let duration = 300;

	onMount(() => {
		above = container?.previousElementSibling ?? void 0;
		if (above instanceof HTMLElement) {
			if (!(above instanceof HTMLButtonElement)) {
				above.setAttribute("tabindex", "0");
				above.addEventListener("keydown", onClick);
			}
			above.addEventListener("click", onClick);
		}
	});

	async function onClick() {
		open = true;
		await tick();
		dialog = container?.querySelector("dialog") ?? void 0;
		if (!dialog) return;
		dialog?.showModal();
		console.log(dialog);
	}

	const onWindowClick = (event: MouseEvent): void => {
		if (!dialog) return;
		// Check if the click is outside the element
		if (!dialog.open || !PopupHelper.isOutsideClick(event, dialog) || !PopupHelper.isOutsideClick(event, above)) return;
		dialog.close();
	};
</script>

<svelte:window on:click={onWindowClick} />

<div bind:this={container}>
	<slot {open} {duration} />
</div>
