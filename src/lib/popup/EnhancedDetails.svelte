<script lang="ts">
	/** TODOC */
	export let open: boolean = false;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** CSS style for container */
	export let style = "";

	/** If we should scroll to end after animation */
	export let autoscroll = false;

	/** */
	let div: HTMLDivElement | undefined;

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
		open = !open;
	}
</script>

<div class={cssClass} {style}>
	<div style="display: contents;" on:click={handleClick} role="button" tabindex="0" on:keyup={handleClick}>
		<slot name="summary">Details</slot>
	</div>
	<div style:display={open ? "contents" : "none"}>
		<slot {open} {scrollToEnd} />
	</div>
</div>
