/** @static */
export class PopupHelper {
	public static isOutsideClick(e: MouseEvent, bounds: Node | null): boolean {
		if (!(bounds instanceof HTMLElement)) return true;

		// Get the bounding rectangle of the element
		const rect = bounds.getBoundingClientRect();
		// Check if the click is outside the element
		return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
	}

	/** TODOC */
	public static getBoundsOfDisplayContents(element: Element): DOMRect {
		if (window.getComputedStyle(element).display === "contents") {
			const childElements = Array.from(element.children);
			if (childElements.length === 0) {
				return element.getBoundingClientRect(); // No children, so no bounds to calculate
			}

			let bounds = childElements[0].getBoundingClientRect();

			childElements.slice(1).forEach((child) => {
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
		} else {
			return element.getBoundingClientRect();
		}
	}
}
