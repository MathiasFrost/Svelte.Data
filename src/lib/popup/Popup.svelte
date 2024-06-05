<script lang="ts">
	import { onMount } from "svelte";
	import { PopupHelper } from "$lib/popup/PopupHelper.js";

	export let type: "hover" | "click" | "contextmenu" = "hover";

	let summaryContainer: HTMLSpanElement | undefined;
	let contentContainer: HTMLDivElement | undefined;
	let open = false;
	let zIndex = 0;
	let left = "0";
	let top = "0";
	let closeTimeout = 0;

	onMount(() => {
		console.log(summaryContainer);
	});

	export function showPopup(): void {
		zIndex = PopupHelper.findHighestZIndex() + 1;
		calculateBounds();
		open = true;
	}

	export function close(): void {
		open = false;
		zIndex = 0;
	}

	function summaryHoverIn(e: FocusEvent | MouseEvent): void {
		window.clearTimeout(closeTimeout);
		if (type !== "hover" || open) return;
		showPopup();
	}

	function summaryHoverOut(e: FocusEvent | MouseEvent): void {
		if (type !== "hover" || !open) return;
		closeTimeout = window.setTimeout(() => close(), 300);
	}

	function summaryClick(e: MouseEvent | KeyboardEvent): void {
		if (type === "contextmenu" && e instanceof KeyboardEvent) {
			summaryContextmenu(e);
			return;
		}

		if (type !== "click") return;

		if (e instanceof KeyboardEvent && !(e.key === "Enter" || e.key === " ")) {
			return;
		}

		if (!open) {
			showPopup();
		} else {
			close();
		}
	}

	function summaryContextmenu(e: MouseEvent | KeyboardEvent): void {
		if (type !== "contextmenu") return;

		if (e instanceof KeyboardEvent) {
			if (e.currentTarget instanceof Element && (e.key === "Enter" || e.key === " ")) {
				if (!open) {
					const bounds = PopupHelper.getMultipleElementBounds(PopupHelper.getEffectiveElements(e.currentTarget));
					top = bounds.top + bounds.height + "px";
					left = bounds.left + "px";
					zIndex = PopupHelper.findHighestZIndex() + 1;
					open = true;
				} else {
					close();
				}
			}
		} else {
			e.preventDefault();
			if (open) close();

			zIndex = PopupHelper.findHighestZIndex() + 1;
			left = e.clientX + window.scrollX + "px";
			top = e.clientY + window.scrollY + "px";
			open = true;
		}
	}

	function calculateBounds(): void {
		if (!summaryContainer) return;
		const bounds = PopupHelper.getMultipleElementBounds(PopupHelper.getEffectiveElements(summaryContainer));
		left = bounds.left + window.scrollX + "px";
		top = bounds.top + bounds.height + window.scrollY + "px";
	}

	function bodyClick(e: MouseEvent): void {
		if (!PopupHelper.isOutsideClick(e, summaryContainer)) return;
		if (!PopupHelper.isOutsideClick(e, contentContainer)) return;
		close();
	}
</script>

<svelte:document on:click={bodyClick} />

<span
	bind:this={summaryContainer}
	tabindex="0"
	role="button"
	on:click={summaryClick}
	on:keypress={summaryClick}
	on:focusin={summaryHoverIn}
	on:mouseenter={summaryHoverIn}
	on:focusout={summaryHoverOut}
	on:mouseleave={summaryHoverOut}
	on:contextmenu={summaryContextmenu}>
	<slot name="summary" />
</span>
<div
	class="content-container"
	class:hidden={!open}
	bind:this={contentContainer}
	tabindex="-1"
	role="button"
	style:z-index={zIndex}
	style:top
	style:left
	on:focusin={summaryHoverIn}
	on:mouseenter={summaryHoverIn}
	on:focusout={summaryHoverOut}
	on:mouseleave={summaryHoverOut}>
	<slot {open} />
</div>

<style lang="scss">
	.content-container {
		position: absolute;
	}

	.hidden {
		display: none;
	}
</style>
