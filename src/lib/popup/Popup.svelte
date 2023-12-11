<script lang="ts" context="module">
	/** TODOC */
	let popupsContainer: HTMLDivElement | null = null;

	/** TODOC */
	let activePopups: number[] = [];
</script>

<script lang="ts">
	import { onMount, tick } from "svelte";
	import { portalDeclared, portalIn, portalOut } from "$lib/popup/portal.js";
	import type { HTMLPopupElement } from "$lib/popup/HTMLPopupElement.js";

	/** TODOC */
	export let open = false;

	/** TODOC */
	export let justify: "above" | "below" | "left" | "right" = "below";

	/** TODOC */
	export let align: "center" | "left" | "right" = "left";

	/** TODOC */
	export let stretch = false;

	/** TODOC */
	export let contain = false;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** TODOC */
	const portalKey = "BODY";

	/** TODOC */
	let popupContainer: HTMLDivElement | null = null;

	// /** TODOC */
	// let container: HTMLDivElement | null = null;

	/** TODOC */
	let anchor: Element | null = null;

	/** TODOC */
	let id = 1;

	/** @see HTMLPopupElement */
	export const self: HTMLPopupElement = {
		showPopup(element: HTMLElement | null) {
			if (typeof element !== "undefined") anchor = element;
			open = true;
		},
		close() {
			open = false;
		}
	};

	// ctor
	onMount(() => {
		if (document.body && !portalDeclared(portalKey) && !popupsContainer) {
			popupsContainer = document.createElement("div");
			document.body.appendChild(popupsContainer);
			portalOut(popupsContainer, portalKey);
		}

		// anchor = container?.previousElementSibling ?? null;
		anchor = popupContainer?.previousElementSibling ?? null;
	});

	// TODOC
	$: toggleActive(open);

	/** TODOC */
	async function toggleActive(open: boolean): Promise<void> {
		if (open) {
			id = 1;
			while (activePopups.includes(id)) ++id;
			activePopups.push(id);

			const rect = await calculateBounds();
			if (!rect || !anchor || !popupContainer) return;

			const anchorRect = anchor.getBoundingClientRect();

			let top: null | number = null;
			let bottom: null | number = null;
			let left: null | number = null;
			let right: null | number = null;
			let height: null | number = null;
			let width: null | number = null;

			switch (justify) {
				case "above":
					break;
				case "below":
					top = anchorRect.top + anchorRect.height + window.scrollY;
					break;
				case "left":
					break;
				case "right":
					break;
			}

			switch (align) {
				case "center":
					break;
				case "left":
					left = anchorRect.left;
					break;
				case "right":
					break;
			}

			if (contain) width = anchorRect.width;

			if (top !== null) popupContainer.style.top = top + "px";
			if (bottom !== null) popupContainer.style.bottom = bottom + "px";
			if (left !== null) popupContainer.style.left = left + "px";
			if (right !== null) popupContainer.style.right = right + "px";
			if (height !== null) popupContainer.style.height = height + "px";
			if (width !== null) popupContainer.style.width = width + "px";

			popupContainer.style.opacity = "1";
		} else {
			activePopups = activePopups.filter((num) => num !== id);
		}
	}

	/** TODOC */
	async function calculateBounds(): Promise<DOMRect | null> {
		await tick();
		return popupContainer?.getBoundingClientRect() ?? null;
	}
</script>

<!--<div bind:this={container}>-->
<div bind:this={popupContainer} class:none={!open} class="container" use:portalIn={portalKey}>
	<slot />
</div>

<!--</div>-->

<style lang="scss">
	.container {
		background-color: crimson;
		position: absolute;
		// These is set with style later
		top: 0;
		left: 0;
		opacity: 0;
		overflow: auto;
	}

	.none {
		display: none;
	}
</style>
