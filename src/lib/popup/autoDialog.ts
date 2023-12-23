import { PopupHelper } from "$lib/popup/PopupHelper.js";

/** TODOC */
export function autoDialog(node: Node): { destroy: () => void } {
	const handleWindowClick = (event: MouseEvent): void => {
		if (node instanceof HTMLDialogElement) {
			// Check if the click is outside the element
			if (!node.open || !PopupHelper.isOutsideClick(event, node)) return;

			node.close();
		}
	};

	const handleClick = () => {
		if (node instanceof HTMLDialogElement) {
			node.showModal();
		}
	};

	let above: Element | null = null;
	if (typeof window !== "undefined" && node instanceof HTMLElement) {
		window.addEventListener("click", handleWindowClick, true);
		above = node.previousElementSibling;
		if (above instanceof HTMLElement) {
			if (!(above instanceof HTMLButtonElement)) {
				above.setAttribute("tabindex", "0");
				above.addEventListener("keydown", handleClick);
			}
			above.addEventListener("click", handleClick);
		}
	}

	return {
		destroy() {
			if (typeof window !== "undefined") {
				window.removeEventListener("click", handleWindowClick, true);
				if (!(above instanceof HTMLButtonElement)) {
					above?.removeAttribute("tabindex");
				}
				above?.removeEventListener("keydown", handleClick);
				above?.removeEventListener("click", handleClick);
			}
		}
	};
}
