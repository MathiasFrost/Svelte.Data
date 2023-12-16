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
}
