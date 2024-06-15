/** @static */
export class PopupHelper {
	/** TODOC */
	public static findHighestZIndex(): number {
		const elements = document.querySelectorAll("*");
		let highestZ = 0;

		elements.forEach((el) => {
			const zIndex = parseInt(window.getComputedStyle(el).zIndex, 10);
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

		const computedStyle = window.getComputedStyle(element);
		if (computedStyle.display === "contents") {
			let effectiveElements: Element[] = [];
			const childElements = Array.from(element.children);

			if (childElements.length === 0) {
				return [element];
			}

			for (const child of childElements) {
				effectiveElements = effectiveElements.concat(this.getEffectiveElements(child));
			}

			return effectiveElements;
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

	/** @returns How like string `a` is to string `b`. -1 for exact match */
	public static likenessScore(a: string, b: string): number {
		// Bonus for exact matches
		if (a.toLowerCase() === b.toLowerCase()) {
			return -1;
		}

		const score = this.levenshteinDistance(a, b.substring(0, a.length));
		return Math.max(score, 0);
	}

	/** @returns The Levenshtein distance between two strings */
	public static levenshteinDistance(a: string, b: string): number {
		const matrix: number[][] = [];

		// Initialize the first row and column of the matrix
		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}
		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		// Calculate the distances
		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1, // substitution
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1 // deletion
					);
				}
			}
		}

		return matrix[b.length][a.length];
	}
}
