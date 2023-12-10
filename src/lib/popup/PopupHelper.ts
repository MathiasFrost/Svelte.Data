/** @static */
export class PopupHelper {
	public static isOutsideClick(e: MouseEvent, bounds: Node | null): boolean {
		if (!(bounds instanceof HTMLElement)) return true;

		// Get the bounding rectangle of the element
		const rect = bounds.getBoundingClientRect();
		// Check if the click is outside the element
		return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
	}
}
