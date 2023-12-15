<script lang="ts" context="module">
	/** TODOC */
	let popupsContainer: HTMLDivElement | null = null;

	/** TODOC */
	let activePopups: number[] = [];
</script>

<script lang="ts">
	import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";
	import { portalDeclared, portalIn, portalOut } from "$lib/popup/portal.js";
	import type { HTMLPopupElement } from "$lib/popup/HTMLPopupElement.js";
	import { PopupHelper } from "$lib/popup/PopupHelper.js";

	/** TODOC */
	const dispatch = createEventDispatcher<{ close: void; show: void }>();

	/** TODOC */
	export let open = false;

	/** TODOC */
	export let modalSmall = false;

	/** TODOC */
	export let anchor: Element | null = null;

	/** TODOC */
	export let justify: "above" | "below" | "left" | "right" = "below";

	/** TODOC */
	export let align: "center" | "start" | "end" | "stretch" | null = null;

	/** TODOC */
	export let contain = false;

	/** TODOC */
	export let auto: boolean | "contextmenu" | "hover" = false;

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
	let id = 1;

	/** TODOC */
	let showing = false;

	/** TODOC */
	let hovering = false;

	/** TODOC */
	let hoverCooldown = false;

	/** TODOC */
	let position: { x: number; y: number } | null = null;

	/** TODOC */
	let destroy: (() => void) | undefined;

	/** @see HTMLPopupElement */
	export const self: HTMLPopupElement = {
		showPopup(arg: HTMLElement | null | { x: number; y: number }) {
			if (typeof arg !== "undefined") {
				if (arg === null || arg instanceof HTMLElement) anchor = arg;
				else position = arg;
			}
			open = true;
		},
		close() {
			open = false;
			position = null;
			if (auto === "hover" && typeof window !== "undefined") {
				hoverCooldown = true;
				window.setTimeout(() => (hoverCooldown = false), 300);
			}
		}
	};

	// ctor
	onMount(() => {
		if (document.body && !portalDeclared(portalKey) && !popupsContainer) {
			popupsContainer = document.createElement("div");
			document.body.appendChild(popupsContainer);
			portalOut(popupsContainer, portalKey);
		}

		anchor ??= popupContainer?.previousElementSibling ?? null;

		// Check if the anchor is null and popupContainer is not null
		if (!anchor && popupContainer) {
			let currentElement: Element | null = popupContainer;

			// Loop until you find a previous sibling or reach the body element
			while (currentElement.parentElement && currentElement.parentElement !== document.body) {
				currentElement = currentElement.parentElement;
				if (currentElement.previousElementSibling) {
					anchor = currentElement.previousElementSibling;
					break;
				}
			}
		}
	});

	// cleanup
	onDestroy(() => {
		if (typeof window !== "undefined" && [auto, "contextmenu"].includes(auto)) {
			window.removeEventListener("click", onWindowClick);
		}
		if (!anchor) return;
		if (!(anchor instanceof HTMLButtonElement) && [true, "contextmenu"].includes(auto)) {
			anchor.removeAttribute("tabindex");
		}
		switch (auto) {
			case true:
				if (!(anchor instanceof HTMLButtonElement)) {
					anchor.removeEventListener("keydown", onClick);
				}
				anchor.removeEventListener("click", onClick);
				break;
			case "contextmenu":
				anchor.removeEventListener("contextmenu", onContextMenu);
				break;
			case "hover":
				anchor.removeEventListener("mouseover", onMouseover);
				anchor.removeEventListener("mouseout", onMouseout);
				break;
		}
		destroy?.();
	});

	// TODOC
	$: handleOpen(open);

	// TODOC
	$: setUpAnchor(anchor, auto);

	/** TODOC */
	function setUpAnchor(anchor: Element | null, auto: boolean | "contextmenu" | "hover"): void {
		if (typeof window !== "undefined" && [auto, "contextmenu"].includes(auto)) {
			window.addEventListener("click", onWindowClick);
		}
		if (!anchor) return;
		if (!(anchor instanceof HTMLButtonElement) && [true, "contextmenu"].includes(auto)) {
			anchor.setAttribute("tabindex", "0");
		}
		switch (auto) {
			case true:
				if (!(anchor instanceof HTMLButtonElement)) {
					anchor.addEventListener("keydown", onClick);
				}
				anchor.addEventListener("click", onClick);
				break;
			case "contextmenu":
				anchor.addEventListener("contextmenu", onContextMenu);
				break;
			case "hover":
				anchor.addEventListener("mouseover", onMouseover);
				anchor.addEventListener("mouseout", onMouseout);
				break;
		}
	}

	/** TODOC */
	function onWindowClick(e: MouseEvent): void {
		if (!open || !showing || !PopupHelper.isOutsideClick(e, child) || !PopupHelper.isOutsideClick(e, anchor)) return;
		self.close();
	}

	/** TODOC */
	function onClick(): void {
		self.showPopup();
	}

	/** TODOC */
	function onContextMenu(e: Event): void {
		if (e instanceof MouseEvent) {
			e.preventDefault();
			self.showPopup({ x: e.clientX, y: e.clientY });
		}
	}

	/** TODOC */
	function onMouseover(): void {
		if (hoverCooldown) return;
		hovering = true;
		self.showPopup();
	}

	/** TODOC */
	function onMouseout(): void {
		hovering = false;
		if (typeof window === "undefined") return;
		window.setTimeout(() => {
			if (hovering) return;
			self.close();
			hoverCooldown = false;
		}, 300);
	}

	/** TODOC */
	async function handleOpen(open: boolean): Promise<void> {
		if (open) {
			id = 1;
			while (activePopups.includes(id)) ++id;
			activePopups.push(id);

			await tick(); // Wait for child
			if (!anchor || !popupContainer || !child) return;

			destroy = portalIn(popupContainer, portalKey).destroy;
			const rect: DOMRect | null = await calculateBounds();
			if (!rect) return;

			const anchorRect = PopupHelper.getBoundsOfDisplayContents(anchor);

			const targetTop: number = position ? position.y : anchorRect.top;
			const targetBottom: number = position ? position.y : anchorRect.bottom;
			const targetLeft: number = position ? position.x : anchorRect.left;
			const targetRight: number = position ? position.x : anchorRect.right;

			let top: null | number = null;
			let bottom: null | number = null;
			let left: null | number = null;
			let right: null | number = null;
			let maxHeight: null | number = null;
			let minHeight: null | number = null;
			let maxWidth: null | number = null;
			let minWidth: null | number = null;

			const viewWidth = window.visualViewport?.width ?? window.innerWidth;
			const viewHeight = window.visualViewport?.height ?? window.innerHeight;

			if (!modalSmall || viewWidth > 600) {
				const anchorStyles = window.getComputedStyle(anchor);
				switch (justify) {
					case "above":
						{
							if (contain) maxWidth = anchorRect.width;
							else minWidth = anchorRect.width;
							const anchorMarginTop = parseInt(anchorStyles.marginTop, 10);
							bottom = viewHeight - targetTop + window.scrollY + anchorMarginTop;

							left = targetLeft + window.scrollX;
							minWidth = anchorRect.width;
						}
						break;
					case "below":
						{
							if (contain) maxWidth = anchorRect.width;
							else minWidth = anchorRect.width;
							const anchorMarginBottom = parseInt(anchorStyles.marginBottom, 10);
							top = targetBottom + window.scrollY + anchorMarginBottom;

							left = targetLeft + window.scrollX;
							minWidth = anchorRect.width;
						}
						break;
					case "left":
						{
							if (contain) maxHeight = anchorRect.height;
							else minHeight = anchorRect.height;
							const anchorMarginLeft = parseInt(anchorStyles.marginLeft, 10);
							right = viewWidth - targetLeft + window.scrollX + anchorMarginLeft;

							top = targetTop + window.scrollY;
							minHeight = anchorRect.height;
						}
						break;
					case "right":
						{
							if (contain) maxHeight = anchorRect.height;
							else minHeight = anchorRect.height;
							const anchorMarginRight = parseInt(anchorStyles.marginRight, 10);
							left = targetRight + window.scrollX + anchorMarginRight;

							top = targetTop + window.scrollY;
							minHeight = anchorRect.height;
						}
						break;
				}
			}

			if (top !== null) {
				const height = viewHeight + window.scrollY;
				if (top + rect.height > height) {
					const overflow = top + rect.height - height;
					top -= overflow;
				}
				popupContainer.style.top = top + "px";
			} else popupContainer.style.top = "";
			if (bottom !== null) {
				const height = viewHeight - window.scrollY;
				if (bottom + rect.height > height) {
					const overflow = bottom + rect.height - height;
					bottom -= overflow;
				}
				popupContainer.style.bottom = bottom + "px";
			} else popupContainer.style.bottom = "";
			if (left !== null) {
				const width = viewWidth + window.scrollX;
				if (left + rect.width > width) {
					const overflow = left + rect.width - width;
					left -= overflow;
				}
				popupContainer.style.left = left + "px";
			} else popupContainer.style.left = "";
			if (right !== null) {
				const width = viewWidth - window.scrollX;
				if (right + rect.width > width) {
					const overflow = right + rect.width - width;
					right -= overflow;
				}
				popupContainer.style.right = right + "px";
			} else popupContainer.style.right = "";
			if (maxHeight !== null) popupContainer.style.maxHeight = maxHeight + "px";
			else popupContainer.style.maxHeight = "";
			if (maxWidth !== null) popupContainer.style.maxWidth = maxWidth + "px";
			else popupContainer.style.maxWidth = "";
			if (minHeight !== null) popupContainer.style.minHeight = minHeight + "px";
			else popupContainer.style.minHeight = "";
			if (minWidth !== null) popupContainer.style.minWidth = minWidth + "px";
			else popupContainer.style.minWidth = "";

			if (align !== null) child.style.alignSelf = align;

			if (auto === "hover") {
				child.addEventListener("mouseover", onMouseover);
				child.addEventListener("mouseout", onMouseout);
			}

			popupContainer.style.opacity = "1";
			showing = true;
			dispatch("show");
		} else {
			activePopups = activePopups.filter((num) => num !== id);
			showing = false;
			dispatch("close");
			destroy?.();
		}
	}

	/** TODOC */
	async function calculateBounds(): Promise<DOMRect | null> {
		await tick();
		return child?.getBoundingClientRect() ?? null;
	}

	/** TODOC */
	function closeClick(onClick: () => void): () => void {
		return () => {
			onClick();
			self.close();
		};
	}
</script>

<div bind:this={popupContainer} class:none={!open} style="left: 0; top: 0;" class="container" class:modal-small={modalSmall}>
	{#if open}
		<div bind:this={child} class={cssClass} {style}>
			<slot {showing} {closeClick} />
		</div>
	{/if}
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

	@media only screen and (max-width: 600px) {
		.modal-small {
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 80%;
			max-width: 400px;
			height: auto;
		}
	}
</style>
