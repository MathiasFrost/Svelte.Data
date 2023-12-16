<script lang="ts" context="module">
	/** TODOC */
	let popupsContainer: HTMLDivElement | null = null;
</script>

<script lang="ts">
	import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";
	import { portalDeclared, portalIn, portalOut } from "$lib/popup/portal.js";
	import type { HTMLPopupElement } from "$lib/popup/HTMLPopupElement.js";
	import { PopupHelper } from "$lib/popup/PopupHelper.js";

	/** TODOC */
	const dispatch = createEventDispatcher<{ close: void; show: void }>();

	/** If popup should be open */
	export let open = false;

	/** If popup should be a centered modal on small screens */
	export let modalSmall = false;

	/** Anchor for the popup */
	export let anchor: Element | null = null;

	/** Placement of the popup from `anchor` */
	export let justify: "above" | "below" | "left" | "right" = "below";

	/** Alignment of popup from `anchor` */
	export let align: "center" | "start" | "end" | "stretch" | null = null;

	/** If overflow should be hidden based on `anchor` */
	export let contain = false;

	/** If we should not automatically close the popup */
	export let keepOpen = false;

	/** For use in conjunction with `EnhancedSelect` */
	export let registerPopup: ((popup: HTMLPopupElement) => void) | null = null;

	/** Element to focus after closing */
	export let reFocus: HTMLElement | null = null;

	/** If we should automatically set up event listeners for interaction and source `anchor` from previous element */
	export let auto: boolean | "contextmenu" | "hover" = false;

	/** CSS class for immediate parent of this component's content */
	let cssClass = "";
	export { cssClass as class };

	/** CSS style for immediate parent of this component's content */
	export let style = "";

	/** For portal */
	const portalKey = "BODY";

	/** Effective anchors based on `anchor` */
	let anchors: Element[] = [];
	$: anchors = PopupHelper.getEffectiveElements(anchor).filter((e) => e !== popupContainer);

	/** Container for popup that should fill the height or width of the `anchor` */
	let popupContainer: HTMLDivElement | null = null;

	/** Immediate parent of this component's content and immediate child of `popupContainer` */
	let child: HTMLDivElement | null = null;

	/** True if the popup is actually visible */
	let showing = false;

	/** Element focused before element was opened */
	let focused: Element | null = null;

	/** True if we are hovering over the `anchor` or popup */
	let hovering = false;

	/** If we are cooling down from mouseover events */
	let hoverCooldown = false;

	/** The position for contextmenu events */
	let position: { x: number; y: number } | null = null;

	/** Called when component is destroyed */
	let destroy: (() => void) | undefined;

	/** @see HTMLPopupElement */
	export const self: HTMLPopupElement = {
		popupContainer,
		async showPopup(arg: HTMLElement | null | { x: number; y: number }) {
			await showPopup(arg);
		},
		close() {
			close();
		}
	};

	// Update props
	$: self.popupContainer = popupContainer;

	// Call `registerPopup` when available
	$: if (registerPopup) registerPopup(self);

	// Call functions when open changes
	$: if (open) showPopup();
	else close();

	// Set up event listeners on `anchor`
	$: setUpAnchor(anchor, auto);

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

		focused = anchor;
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

	/** Set up event listeners */
	function setUpAnchor(anchor: Element | null, auto: boolean | "contextmenu" | "hover"): void {
		if (typeof window !== "undefined" && [true, "contextmenu"].includes(auto)) {
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

	/** Handle window clicks */
	function onWindowClick(e: MouseEvent): void {
		if (keepOpen || !open || !showing || !PopupHelper.isOutsideClick(e, child) || !PopupHelper.isOutsideClick(e, anchor)) return;
		self.close();
	}

	/** Handle `anchor` clicks */
	function onClick(): void {
		self.showPopup();
	}

	/** Handle `anchor` contextmenu events */
	function onContextMenu(e: Event): void {
		if (e instanceof MouseEvent) {
			e.preventDefault();
			self.showPopup({ x: e.clientX, y: e.clientY });
		}
	}

	/** Handle `anchor` mouseover events */
	function onMouseover(): void {
		if (hoverCooldown) return;
		hovering = true;
		self.showPopup();
	}

	/** Handle `anchor` mouseout events */
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
	function close(): void {
		open = false;
		position = null;
		if (auto === "hover" && typeof window !== "undefined") {
			hoverCooldown = true;
			window.setTimeout(() => (hoverCooldown = false), 300);
		}
		showing = false;
		dispatch("close");
		destroy?.();
		if (reFocus) reFocus?.focus();
		else if (typeof window !== "undefined" && focused instanceof HTMLElement) focused.focus();
	}

	/** Open the popup */
	async function showPopup(arg?: HTMLElement | null | { x: number; y: number }): Promise<void> {
		open = true;
		if (typeof arg !== "undefined") {
			if (arg === null || arg instanceof HTMLElement) anchor = arg;
			else position = arg;
		}

		if (typeof document !== "undefined" && document.activeElement !== document.body) focused = document.activeElement;
		else focused = anchor;

		await tick(); // Wait for child
		if (!anchors.length || !anchor || !popupContainer || !child) return;

		destroy = portalIn(popupContainer, portalKey).destroy;
		const rect: DOMRect | null = await calculateBounds();
		if (!rect) return;

		const anchorRect = PopupHelper.getMultipleElementBounds(anchors);

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
			const anchorStyles = anchors.map((el) => window.getComputedStyle(el));
			const maxMarginTop = Math.max(...anchorStyles.map((styles) => parseInt(styles.marginTop, 10)));
			const maxMarginBottom = Math.max(...anchorStyles.map((styles) => parseInt(styles.marginBottom, 10)));
			const maxMarginLeft = Math.max(...anchorStyles.map((styles) => parseInt(styles.marginLeft, 10)));
			const maxMarginRight = Math.max(...anchorStyles.map((styles) => parseInt(styles.marginRight, 10)));

			switch (justify) {
				case "above":
					{
						if (contain) maxWidth = anchorRect.width;
						else minWidth = anchorRect.width;
						bottom = viewHeight - targetTop + window.scrollY + maxMarginTop;

						left = targetLeft + window.scrollX;
						minWidth = anchorRect.width;
					}
					break;
				case "below":
					{
						if (contain) maxWidth = anchorRect.width;
						else minWidth = anchorRect.width;
						top = targetBottom + window.scrollY + maxMarginBottom;

						left = targetLeft + window.scrollX;
						minWidth = anchorRect.width;
					}
					break;
				case "left":
					{
						if (contain) maxHeight = anchorRect.height;
						else minHeight = anchorRect.height;
						right = viewWidth - targetLeft + window.scrollX + maxMarginLeft;

						top = targetTop + window.scrollY;
						minHeight = anchorRect.height;
					}
					break;
				case "right":
					{
						if (contain) maxHeight = anchorRect.height;
						else minHeight = anchorRect.height;
						left = targetRight + window.scrollX + maxMarginRight;

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

		if (align !== null) {
			const vertical = ["left", "right"].includes(justify);
			switch (align) {
				case "center":
					if (vertical) {
						child.style.marginTop = "auto";
						child.style.marginBottom = "auto";
					} else {
						child.style.marginLeft = "auto";
						child.style.marginRight = "auto";
					}
					break;
				case "start":
					if (vertical) child.style.marginBottom = "auto";
					else child.style.marginRight = "auto";
					break;
				case "end":
					if (vertical) child.style.marginTop = "auto";
					else child.style.marginLeft = "auto";
					break;
				case "stretch":
					if (vertical) child.style.height = "100%";
					else child.style.width = "100%";
					break;
			}
		}

		if (auto === "hover") {
			child.addEventListener("mouseover", onMouseover);
			child.addEventListener("mouseout", onMouseout);
		}

		popupContainer.style.opacity = "1";
		showing = true;
		dispatch("show");
		const first = child.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
		if (first instanceof HTMLElement) first.focus();
	}

	/** Get bounds of `child` after rendered */
	async function calculateBounds(): Promise<DOMRect | null> {
		await tick();
		return child?.getBoundingClientRect() ?? null;
	}

	/** Function to close popup after a custom event */
	function closeClick(onClick?: () => void): () => void {
		return () => {
			onClick?.();
			self.close();
		};
	}
</script>

<div bind:this={popupContainer} class:none={!open} style="left: 0; top: 0;" class="container">
	{#if open}
		<div bind:this={child} class={cssClass} {style} class:modal-small={modalSmall}>
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

		@media only screen and (max-width: 600px) {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background-color: rgba(0, 0, 0, 0.16);
			backdrop-filter: blur(2px);
		}
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
