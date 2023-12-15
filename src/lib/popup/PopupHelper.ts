/** @static */
export class PopupHelper {
	public static isOutsideClick(e: MouseEvent, bounds: Node | null): boolean {
		if (!(bounds instanceof HTMLElement)) return true;

		// Get the bounding rectangle of the element
		const elements = this.getEffectiveElements(bounds);
		const rect = this.getMultipleElementBounds(elements);
		// Check if the click is outside the element
		return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
	}

	/** TODOC */
	public static getMultipleElementBounds(elements: Element[]): DOMRect {
		let bounds = elements[0].getBoundingClientRect();

		elements.slice(1).forEach((child) => {
			const rect = child.getBoundingClientRect();
			bounds = {
				top: Math.min(bounds.top, rect.top),
				right: Math.max(bounds.right, rect.right),
				bottom: Math.max(bounds.bottom, rect.bottom),
				left: Math.min(bounds.left, rect.left),
				width: 0, // width and height will be calculated later
				height: 0,
				x: 0,
				y: 0
			};
		});

		// Calculate width and height based on the computed bounds
		bounds.width = bounds.right - bounds.left;
		bounds.height = bounds.bottom - bounds.top;

		return bounds;
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
}
