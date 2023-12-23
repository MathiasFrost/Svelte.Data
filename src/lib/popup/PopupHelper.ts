/** @static */
export class PopupHelper {
	/** TODOC */
	public static isOutsideClick(e: MouseEvent, bounds: Node | null | undefined): boolean {
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
	public static firstFocusable(startingPoints: Element | null | undefined): HTMLElement | null {
		const first = startingPoints?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
		if (first instanceof HTMLElement && first.getAttribute("tabindex") !== "-1" && !first.hidden) {
			return first;
		}
		return null;
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
