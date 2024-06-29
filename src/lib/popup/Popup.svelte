<svelte:options accessors={true} />

<script lang="ts">
	import { onMount, tick } from "svelte";
	import { PopupHelper } from "$lib/popup/PopupHelper.js";

	export let type: "hover" | "click" | "contextmenu" | "manual" = "hover";
	export let open = false;
	export let delay = 0;

	let delayedOpen = false;
	let summaryContainer: HTMLSpanElement | undefined;
	let contentContainer: HTMLDivElement | undefined;
	let focused = false;
	let zIndex = 0;
	let left = "0";
	let top = "0";
	let closeTimeout = 0;
	let contents = false;
	let openedOnce = false;
	let mounted = false;
	let lastFocused: HTMLElement | null;

	onMount(() => {
		contents = !!summaryContainer?.children.length;
		mounted = true;
	});

	$: if (open && mounted) showPopup();
	else if (openedOnce) close();

	export function showPopup(): void {
		openedOnce = true;
		zIndex = PopupHelper.findHighestZIndex() + 1;
		calculateBounds();
		open = true;
		delayedOpen = true;
		focusFirst();
	}

	export function close(): void {
		open = false;
		if (delay > 0) {
			window.clearTimeout(closeTimeout);
			closeTimeout = window.setTimeout(() => {
				delayedOpen = false;
				zIndex = 0;
				lastFocused?.focus();
			}, delay);
			return;
		}

		delayedOpen = false;
		zIndex = 0;
		lastFocused?.focus();
	}

	function summaryHoverIn(e: FocusEvent | MouseEvent): void {
		if (type === "manual") return;
		if (e instanceof FocusEvent) focused = true;
		window.clearTimeout(closeTimeout);
		if (type !== "hover" || open) return;
		showPopup();
	}

	function summaryHoverOut(e: FocusEvent | MouseEvent): void {
		if (type === "manual") return;
		if (e instanceof FocusEvent) focused = false;
		if (type !== "hover" || !open || focused) return;
		closeTimeout = window.setTimeout(() => close(), 300);
	}

	function summaryClick(e: MouseEvent | KeyboardEvent): void {
		if (type === "manual") return;
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
					delayedOpen = true;
					focusFirst();
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
			delayedOpen = true;
			focusFirst();
		}
	}

	function calculateBounds(): void {
		if (!summaryContainer) return;
		const bounds = PopupHelper.getMultipleElementBounds(PopupHelper.getEffectiveElements(summaryContainer));
		left = bounds.left + window.scrollX + "px";
		top = bounds.top + bounds.height + window.scrollY + "px";
	}

	function documentClick(e: MouseEvent): void {
		if (type === "manual") return;
		if (!PopupHelper.isOutsideClick(e, summaryContainer)) return;
		if (!PopupHelper.isOutsideClick(e, contentContainer)) return;
		close();
	}

	function documentKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && open && type !== "manual") {
			e.preventDefault();
			close();
		}
	}

	async function focusFirst(): Promise<void> {
		if (typeof window === "undefined") return;

		const candidate = document.activeElement;
		lastFocused = candidate instanceof HTMLElement ? candidate : null;

		await tick();
		PopupHelper.firstFocusable(contentContainer)?.focus();
	}
</script>

<svelte:document on:click={documentClick} on:keydown={documentKeydown} />

<span
	bind:this={summaryContainer}
	class:contents
	tabindex="0"
	role="button"
	on:click={summaryClick}
	on:keypress={summaryClick}
	on:focusin={summaryHoverIn}
	on:mouseenter={summaryHoverIn}
	on:focusout={summaryHoverOut}
	on:mouseleave={summaryHoverOut}
	on:contextmenu={summaryContextmenu}>
	<slot name="summary" {open} {close} />
</span>
<div
	class="content-container"
	class:hidden={!open && !delayedOpen}
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
	<slot {open} {close} {delay} />
</div>

<style lang="scss">
	.content-container {
		position: absolute;
	}

	.hidden {
		display: none;
	}

	.contents {
		display: contents;
	}
</style>
