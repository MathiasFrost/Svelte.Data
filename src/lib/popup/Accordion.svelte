<svelte:options accessors={true} />

<script lang="ts">
	import { createEventDispatcher } from "svelte";

	/** TODOC */
	const dispatch = createEventDispatcher<{ show: void; close: void }>();

	/** TODOC */
	let _open: boolean = false;

	/** TODOC */
	export let open: boolean = false;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** CSS style for container */
	export let style = "";

	/** If we should scroll to end after animation */
	export let autoscroll = false;

	/** TODOC */
	export let delay = 0;

	/** TODOC */
	let div: HTMLDivElement | undefined;

	/** TODOC */
	let delayedOpen = _open;

	/** TODOC */
	let closeTimeout = 0;

	$: if (_open) showAccordion();
	else close();

	/** TODOC */
	function scrollToEnd(): void {
		if (autoscroll && div) {
			const rect = div.getBoundingClientRect();

			if (
				rect.top >= 0 &&
				rect.left >= 0 &&
				rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) /* or $(window).height() */ &&
				rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
			)
				return;

			window.scrollTo({ top: div.offsetTop, behavior: "smooth" });
		}
	}

	/** TODOC */
	function handleClick(): void {
		if (_open) close();
		else showAccordion();
	}

	/** TODOC */
	export function showAccordion(): void {
		if (_open) {
			return;
		}

		_open = true;
		open = true;
		delayedOpen = true;
		dispatch("show");
	}

	/** TODOC */
	export function close(): void {
		if (!_open) {
			return;
		}

		_open = false;
		open = false;
		if (delay > 0) {
			window.clearTimeout(closeTimeout);
			closeTimeout = window.setTimeout(() => {
				delayedOpen = false;
			}, delay);
		} else {
			delayedOpen = false;
		}
		dispatch("close");
	}
</script>

<div class={cssClass} {style}>
	<span style="display: contents;" on:click={handleClick} role="button" tabindex="0" on:keyup={handleClick}>
		<slot name="summary">Details</slot>
	</span>
	<div style:display={_open || delayedOpen ? "contents" : "none"}>
		<slot open={_open} {scrollToEnd} {delay} />
	</div>
</div>
