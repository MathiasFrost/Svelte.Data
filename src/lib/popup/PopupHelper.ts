/** @static */
export class PopupHelper {
	/** TODOC */
	public static findHighestZIndex(): number {
		let elements = document.querySelectorAll("*");
		let highestZ = 0;

		elements.forEach((el) => {
			let zIndex = parseInt(window.getComputedStyle(el).zIndex, 10);
			if (!isNaN(zIndex)) {
				highestZ = Math.max(highestZ, zIndex);
			}
		});

		return highestZ;
	}

	/** TODOC */
	public static isOutsideClick(e: MouseEvent, bounds: Node | null | undefined): boolean {
		// If screen doesn't have any pixels, fallback to contains
		if (e.screenX === 0 && e.screenY === 0) {
			return e.target instanceof Node && !bounds?.contains(e.target);
		}

		if (!(bounds instanceof HTMLElement)) return true;

		// Get the bounding rectangle of the element
		const elements = this.getEffectiveElements(bounds);
		const rect = this.getMultipleElementBounds(elements);

		// Check if the click is outside the element
		return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
	}

	/** TODOC */
	public static getMultipleElementBounds(elements: Element[]): DOMRect {
		if (elements.length === 0) {
			return new DOMRect();
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		elements.forEach((element) => {
			const rect = element.getBoundingClientRect();
			minX = Math.min(minX, rect.left);
			minY = Math.min(minY, rect.top);
			maxX = Math.max(maxX, rect.right);
			maxY = Math.max(maxY, rect.bottom);
		});

		const width = maxX - minX;
		const height = maxY - minY;

		return new DOMRect(minX, minY, width, height);
	}

	/** TODOC */
	public static getEffectiveElements(element: Element | null): Element[] {
		if (!element) return [];
		if (window.getComputedStyle(element).display === "contents") {
			const childElements = Array.from(element.children);
			if (childElements.length === 0) {
				return [element];
			}

			return childElements;
		} else {
			return [element];
		}
	}

	/** TODOC */
	public static findParentWithDisplay(element: HTMLElement | null): HTMLElement | null {
		if (typeof document === "undefined") return null;
		while (element && element !== document.body) {
			const display = window.getComputedStyle(element).display;
			if (display !== "none" && display !== "inline" && display !== "inline-block") {
				return element;
			}
			element = element.parentElement;
		}
		return null; // No parent with distinct display found
	}

	/** TODOC */
	public static firstFocusable(startingPoints: Element | null | undefined): HTMLElement | null {
		const first = startingPoints?.querySelector(this.focusableElementQuery);
		return first instanceof HTMLElement ? first : null;
	}

	/** TODOC */
	public static focusableElementQuery = `
  button:not(:disabled):not([aria-hidden="true"]):not([tabindex="-1"]),
  [href]:not([aria-hidden="true"]):not([tabindex="-1"]),
  input:not(:disabled):not([type="hidden"]):not([aria-hidden="true"]):not([tabindex="-1"]),
  select:not(:disabled):not([aria-hidden="true"]):not([tabindex="-1"]),
  textarea:not(:disabled):not([aria-hidden="true"]):not([tabindex="-1"]),
  [tabindex]:not([tabindex="-1"]):not([aria-hidden="true"]),
  [contenteditable]:not([contenteditable="false"]):not([aria-hidden="true"]):not([tabindex="-1"])
`;

	/** TODOC */
	public static allFocusable(container: Element | null | undefined | Document): HTMLElement[] {
		return Array.from(container?.querySelectorAll<HTMLElement>(this.focusableElementQuery) ?? []);
	}

	/** TODOC */
	public static hasMoreFocusable(container: Element | null | undefined, reverse: boolean): boolean {
		const focusable = this.allFocusable(container);
		const current = document.activeElement;
		if (current instanceof HTMLElement) {
			const index = focusable.indexOf(current);
			if (reverse) {
				return index > 0;
			} else {
				return index < focusable.length - 1;
			}
		}
		return false;
	}

	/** TODOC */
	static firstScrollBox(startingPoint: Element | null): Element | null {
		while (typeof window !== "undefined" && startingPoint && startingPoint !== document.body) {
			const overflowY = window.getComputedStyle(startingPoint).overflowY;
			const isScrollable = overflowY !== "visible" && overflowY !== "hidden";

			if (isScrollable && startingPoint.scrollHeight > startingPoint.clientHeight) {
				return startingPoint;
			}

			startingPoint = startingPoint.parentElement;
		}
		return null;
	}
}
