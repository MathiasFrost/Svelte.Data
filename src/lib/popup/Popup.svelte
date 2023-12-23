<script lang="ts" context="module">
	/** TODOC */
	let popupsContainer: HTMLDivElement | null = null;
</script>

<script lang="ts">
	import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";
	import { portalDeclared, portalIn, portalOut } from "$lib/popup/portal.js";
	import type { HTMLPopupElement } from "$lib/popup/HTMLPopupElement.js";
	import { PopupHelper } from "$lib/popup/PopupHelper.js";

	/** For portal */
	const portalKey = "BODY";

	/** TODOC */
	const dispatch = createEventDispatcher<{ close: void; show: void }>();

	/** If popup should be open */
	export let open = false;

	/** If popup should be a centered modal on small screens */
	export let modalSmall = false;

	/** Placement of the popup from `anchor` */
	export let justify: "above" | "below" | "left" | "right" = "below";

	/** If popup should grow from start or end */
	export let float: "start" | "end" = "start";

	/** Alignment of popup from `anchor` */
	export let align: "center" | "start" | "end" | "stretch" | null = null;

	/** If overflow should be hidden based on `anchor` */
	export let contain = false;

	/** If we should automatically set up event listeners for interaction and source `anchor` from previous element */
	export let auto: boolean | "contextmenu" | "hover" = false;

	/** CSS class for container */
	let cssClass = "";
	export { cssClass as class };

	/** CSS style for container */
	export let style = "";

	/** Reference to definitive anchor element */
	export let anchor: Element | null = null;

	/** Container */
	let container: HTMLDivElement | null = null;

	/** Container for popup that should fill the height or width of the `anchor` */
	let outerContainer: HTMLDivElement | null = null;

	/** Immediate parent of this component's content and immediate child of `popupContainer` */
	let innerContainer: HTMLDivElement | null = null;

	/** Element focused before element was opened */
	let lastFocused: Element | null = null;

	/** True if we are hovering over the `anchor` or popup */
	let hovering = false;

	/** If we are cooling down from mouseover events */
	let hoverCooldown = false;

	/** The position for contextmenu events */
	let position: { x: number; y: number } | null = null;

	/** Called when component is destroyed */
	let destroy: (() => void) | null = null;

	/** The element we will use as anchor. Can be set from `anchor`, `arg` in `showPopup` or the default: `container` */
	let effectiveAnchor: Element | null = null;

	/** The first scroll box */
	let scrollBox: Element | null = null;

	/** @see HTMLPopupElement */
	export const self: HTMLPopupElement | null = {
		innerContainer,
		async showPopup(arg: HTMLElement | null | { x: number; y: number }) {
			await showPopup(arg);
		},
		close() {
			close();
		}
	};

	// Update props
	$: self.innerContainer = innerContainer;

	// Call functions when open changes
	$: if (open) {
		if (outerContainer && innerContainer) showPopup();
	} else {
		close();
	}

	// Set up event listeners
	$: initialize(container, auto);

	// ctor
	onMount(() => {
		if (document.body && !portalDeclared(portalKey) && !popupsContainer) {
			popupsContainer = document.createElement("div");
			document.body.appendChild(popupsContainer);
			portalOut(popupsContainer, portalKey);
		}
	});

	// cleanup
	onDestroy(() => {
		if (container) removeListeners(container);
		destroy?.();
	});

	/** Set up event listeners */
	function initialize(container: Element | null, auto: boolean | "contextmenu" | "hover"): void {
		if (!container || typeof window === "undefined") return;

		removeListeners(container);
		switch (auto) {
			case true:
				if (!(container instanceof HTMLButtonElement)) {
					container.addEventListener("keydown", onClick);
				}
				container.addEventListener("click", onClick);
				break;
			case "contextmenu":
				container.addEventListener("contextmenu", onContextMenu);
				break;
			case "hover":
				container.addEventListener("mouseover", onMouseover);
				container.addEventListener("mouseout", onMouseout);
				break;
		}
	}

	/** Remove all event listeners */
	function removeListeners(anchor: Element): void {
		anchor.removeEventListener("keydown", onClick);
		anchor.removeEventListener("click", onClick);
		anchor.removeEventListener("contextmenu", onContextMenu);
		anchor.removeEventListener("mouseover", onMouseover);
		anchor.removeEventListener("mouseout", onMouseout);
	}

	/** Handle window clicks */
	function onWindowClick(e: MouseEvent): void {
		if (!open || !PopupHelper.isOutsideClick(e, innerContainer) || !PopupHelper.isOutsideClick(e, effectiveAnchor)) return;
		lastFocused = null;
		close();
	}

	/** Handle window clicks */
	function onWindowKeydown(e: KeyboardEvent): void {
		if (e.key !== "Escape") return;
		close();
	}

	/** Handle `anchor` clicks */
	function onClick(e: Event): void {
		if (e instanceof KeyboardEvent && e.key !== "Enter") return;
		showPopup();
	}

	/** Handle `anchor` contextmenu events */
	function onContextMenu(e: Event): void {
		if (e instanceof MouseEvent) {
			e.preventDefault();
			showPopup({ x: e.clientX, y: e.clientY });
		}
	}

	/** Handle `anchor` mouseover events */
	function onMouseover(): void {
		if (hoverCooldown) return;
		hovering = true;
		showPopup();
	}

	/** Handle `anchor` mouseout events */
	function onMouseout(): void {
		hovering = false;
		if (typeof window === "undefined") return;
		window.setTimeout(() => {
			if (hovering) return;
			close();
			hoverCooldown = false;
		}, 300);
	}

	/** Function to close popup after a custom event */
	function closeClick(onClick?: () => void): () => void {
		return () => {
			onClick?.();
			close();
		};
	}

	/** Open the popup */
	async function showPopup(arg?: HTMLElement | null | { x: number; y: number }): Promise<void> {
		if (!container || !outerContainer) return;

		effectiveAnchor = anchor ?? container;
		if (arg) {
			if (arg instanceof HTMLElement) {
				effectiveAnchor = arg;
				removeListeners(effectiveAnchor);
				initialize(effectiveAnchor, auto);
			} else if ("x" in arg && "y" in arg) {
				position = arg;
			}
		}

		const isFirstShow = !open;
		if (isFirstShow) await firstShow(outerContainer); // Portals the container to body container;
		if (!innerContainer) return;

		calculatePosition();

		if (align !== null) {
			const vertical = ["left", "right"].includes(justify);
			switch (align) {
				case "center":
					if (vertical) {
						innerContainer.style.marginTop = "auto";
						innerContainer.style.marginBottom = "auto";
					} else {
						innerContainer.style.marginLeft = "auto";
						innerContainer.style.marginRight = "auto";
					}
					break;
				case "start":
					if (vertical) innerContainer.style.marginBottom = "auto";
					else innerContainer.style.marginRight = "auto";
					break;
				case "end":
					if (vertical) innerContainer.style.marginTop = "auto";
					else innerContainer.style.marginLeft = "auto";
					break;
				case "stretch":
					if (vertical) innerContainer.style.height = "100%";
					else innerContainer.style.width = "100%";
					break;
			}
		}
		outerContainer.style.opacity = "1";
		dispatch("show");

		if (isFirstShow) PopupHelper.firstFocusable(innerContainer)?.focus();
	}

	/** Stuff that should only happen on first show (reset after close) */
	async function firstShow(outerContainer: HTMLDivElement): Promise<void> {
		if (typeof document !== "undefined") lastFocused = document.activeElement;

		open = true;
		await tick(); // Wait for child to be rendered
		destroy = portalIn(outerContainer, portalKey).destroy;

		if (auto === "hover" && innerContainer) {
			innerContainer.addEventListener("mouseover", onMouseover);
			innerContainer.addEventListener("mouseout", onMouseout);
		}
		if (typeof window !== "undefined") window.addEventListener("resize", calculatePosition);

		scrollBox = PopupHelper.firstScrollBox(container);
		if (scrollBox) scrollBox.addEventListener("scroll", calculatePosition);
	}

	/** Set positional styles on element */
	function calculatePosition(): void {
		if (!effectiveAnchor || !outerContainer || !innerContainer) return;
		const anchors = PopupHelper.getEffectiveElements(effectiveAnchor).filter((e) => e !== <Element>outerContainer);
		const rect = innerContainer.getBoundingClientRect();
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

						switch (float) {
							case "start":
								left = targetLeft + window.scrollX;
								break;
							case "end":
								right = viewWidth - targetRight + window.scrollX;
								break;
						}
						minWidth = anchorRect.width;
					}
					break;
				case "below":
					{
						if (contain) maxWidth = anchorRect.width;
						else minWidth = anchorRect.width;
						top = targetBottom + window.scrollY + maxMarginBottom;

						switch (float) {
							case "start":
								left = targetLeft + window.scrollX;
								break;
							case "end":
								right = viewWidth - targetRight + window.scrollX;
								break;
						}
						minWidth = anchorRect.width;
					}
					break;
				case "left":
					{
						if (contain) maxHeight = anchorRect.height;
						else minHeight = anchorRect.height;
						right = viewWidth - targetLeft + window.scrollX + maxMarginLeft;

						switch (float) {
							case "start":
								top = targetTop + window.scrollY;
								break;
							case "end":
								bottom = viewHeight - targetTop + window.scrollY;
								break;
						}
						minHeight = anchorRect.height;
					}
					break;
				case "right":
					{
						if (contain) maxHeight = anchorRect.height;
						else minHeight = anchorRect.height;
						left = targetRight + window.scrollX + maxMarginRight;

						switch (float) {
							case "start":
								top = targetTop + window.scrollY;
								break;
							case "end":
								bottom = viewHeight - targetTop + window.scrollY;
								break;
						}
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
			outerContainer.style.top = top + "px";
		} else outerContainer.style.top = "";
		if (bottom !== null) {
			const height = viewHeight - window.scrollY;
			if (bottom + rect.height > height) {
				const overflow = bottom + rect.height - height;
				bottom -= overflow;
			}
			outerContainer.style.bottom = bottom + "px";
		} else outerContainer.style.bottom = "";
		if (left !== null) {
			const width = viewWidth + window.scrollX;
			if (left + rect.width > width) {
				const overflow = left + rect.width - width;
				left -= overflow;
			}
			outerContainer.style.left = left + "px";
		} else outerContainer.style.left = "";
		if (right !== null) {
			const width = viewWidth - window.scrollX;
			if (right + rect.width > width) {
				const overflow = right + rect.width - width;
				right -= overflow;
			}
			outerContainer.style.right = right + "px";
		} else outerContainer.style.right = "";
		if (maxHeight !== null) outerContainer.style.maxHeight = maxHeight + "px";
		else outerContainer.style.maxHeight = "";
		if (maxWidth !== null) outerContainer.style.maxWidth = maxWidth + "px";
		else outerContainer.style.maxWidth = "";
		if (minHeight !== null) outerContainer.style.minHeight = minHeight + "px";
		else outerContainer.style.minHeight = "";
		if (minWidth !== null) outerContainer.style.minWidth = minWidth + "px";
		else outerContainer.style.minWidth = "";
	}

	/** Handle closing of the popup */
	function close(): void {
		if (!open) return; // No logic here that makes sense to run when already closed

		switch (auto) {
			case true:
				break;
			case "hover":
				if (typeof window !== "undefined") {
					hoverCooldown = true;
					window.setTimeout(() => (hoverCooldown = false), 300);
				}
				break;
			case "contextmenu":
				position = null;
				break;
		}

		if (typeof window !== "undefined") window.removeEventListener("resize", calculatePosition);
		if (scrollBox) scrollBox.removeEventListener("scroll", calculatePosition);

		if (destroy) {
			destroy();
			destroy = null;
		}

		if (open && lastFocused instanceof HTMLElement) {
			lastFocused?.focus();
		}

		if (container && effectiveAnchor !== <Element>container) {
			effectiveAnchor = container;
			initialize(container, auto);
		}

		open = false;
		dispatch("close");
	}
</script>

<svelte:window on:click={(e) => onWindowClick(e)} on:keydown={onWindowKeydown} />

<div class={cssClass} {style} bind:this={container}>
	<slot name="summary" />
	<!-- Below here will be teleported -->
	<div bind:this={outerContainer} class:none={!open} style="left: 0; top: 0;" class="container">
		<div bind:this={innerContainer} style:overflow="hidden" class:modal-small={modalSmall}>
			<slot {closeClick} />
		</div>
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

	@media only screen and (max-width: 600px) {
		.modal-small {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background-color: rgba(0, 0, 0, 0.16);
			backdrop-filter: blur(2px);
		}
	}
</style>
