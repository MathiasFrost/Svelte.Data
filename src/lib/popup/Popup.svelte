<script lang="ts" context="module">
	/** TODOC */
	let popupsContainer: HTMLDivElement | null = null;

	/** TODOC */
	let activePopups: number[] = [];
</script>

<script lang="ts">
	import { onMount, onDestroy, tick } from "svelte";
	import { portalDeclared, portalIn, portalOut } from "$lib/popup/portal.js";
	import type { HTMLPopupElement } from "$lib/popup/HTMLPopupElement.js";

	/** TODOC */
	export let open = false;

	/** TODOC */
	export let justify: "above" | "below" | "left" | "right" = "below";

	/** TODOC */
	export let align: "center" | "start" | "end" | "stretch" | null = null;

	/** TODOC */
	export let contain = false;

	/** TODOC */
	let cssClass = "";
	export { cssClass as class };

	/** TODOC */
	export let style = "";

	/** TODOC */
	const portalKey = "BODY";

	/** TODOC */
	let popupContainer: HTMLDivElement | null = null;

	/** TODOC */
	let child: HTMLDivElement | null = null;

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

		anchor = popupContainer?.previousElementSibling ?? null;
	});

	// cleanup
	onDestroy(() => {
		open = false;
	});

	// TODOC
	$: toggleActive(open);

	/** TODOC */
	async function toggleActive(open: boolean): Promise<void> {
		if (open) {
			id = 1;
			while (activePopups.includes(id)) ++id;
			activePopups.push(id);

			const rect: DOMRect | null = await calculateBounds();
			if (!rect || !anchor || !popupContainer || !child) return;

			const anchorRect = anchor.getBoundingClientRect();

			let top: null | number = null;
			let bottom: null | number = null;
			let left: null | number = null;
			let right: null | number = null;
			let maxHeight: null | number = null;
			let minHeight: null | number = null;
			let maxWidth: null | number = null;
			let minWidth: null | number = null;

			const anchorStyles = window.getComputedStyle(anchor);
			switch (justify) {
				case "above":
					{
						if (contain) maxWidth = anchorRect.width;
						else minWidth = anchorRect.width;
						const anchorMarginTop = parseInt(anchorStyles.marginTop, 10);
						bottom = (window.visualViewport?.height ?? window.innerHeight) - anchorRect.top + window.scrollY + anchorMarginTop;

						left = anchorRect.left + window.scrollX;
						minWidth = anchorRect.width;
					}
					break;
				case "below":
					{
						if (contain) maxWidth = anchorRect.width;
						else minWidth = anchorRect.width;
						const anchorMarginBottom = parseInt(anchorStyles.marginBottom, 10);
						top = anchorRect.bottom + window.scrollY + anchorMarginBottom;

						left = anchorRect.left + window.scrollX;
						minWidth = anchorRect.width;
					}
					break;
				case "left":
					{
						if (contain) maxHeight = anchorRect.height;
						else minHeight = anchorRect.height;
						const anchorMarginLeft = parseInt(anchorStyles.marginLeft, 10);
						right = (window.visualViewport?.width ?? window.innerWidth) - anchorRect.left + window.scrollX + anchorMarginLeft;

						top = anchorRect.top + window.scrollY;
						minHeight = anchorRect.height;
					}
					break;
				case "right":
					{
						if (contain) maxHeight = anchorRect.height;
						else minHeight = anchorRect.height;
						const anchorMarginRight = parseInt(anchorStyles.marginRight, 10);
						left = anchorRect.right + window.scrollX + anchorMarginRight;

						top = anchorRect.top + window.scrollY;
						minHeight = anchorRect.height;
					}
					break;
			}

			if (top !== null) popupContainer.style.top = top + "px";
			else popupContainer.style.top = "";
			if (bottom !== null) popupContainer.style.bottom = bottom + "px";
			else popupContainer.style.bottom = "";
			if (left !== null) popupContainer.style.left = left + "px";
			else popupContainer.style.left = "";
			if (right !== null) popupContainer.style.right = right + "px";
			else popupContainer.style.right = "";
			if (maxHeight !== null) popupContainer.style.maxHeight = maxHeight + "px";
			else popupContainer.style.maxHeight = "";
			if (maxWidth !== null) popupContainer.style.maxWidth = maxWidth + "px";
			else popupContainer.style.maxWidth = "";
			if (minHeight !== null) popupContainer.style.minHeight = minHeight + "px";
			else popupContainer.style.minHeight = "";
			if (minWidth !== null) popupContainer.style.minWidth = minWidth + "px";
			else popupContainer.style.minWidth = "";

			if (align !== null) child.style.alignSelf = align;
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

<div bind:this={popupContainer} class:none={!open} style="left: 0; top: 0;" class="container" use:portalIn={portalKey}>
	<div bind:this={child} class={cssClass} {style}>
		<slot />
	</div>
</div>

<style lang="scss">
	.container {
		position: absolute;
		// These is set with style later
		opacity: 0;
		overflow: hidden;
		display: flex;
	}

	.none {
		display: none;
	}
</style>
