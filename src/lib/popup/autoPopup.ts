import { PopupHelper } from "$lib/popup/PopupHelper.js";

/** TODOC */
export function autoPopup(node: Node): { destroy: () => void } {
	const handleWindowClick = (event: MouseEvent): void => {
		// Check if the click is outside the element
		if (!PopupHelper.isOutsideClick(event, node)) return;

		if (node instanceof HTMLDialogElement) {
			node.close();
		} else if (node instanceof HTMLElement) {
			const content = node.classList.contains(".dropdown-content") ? node : node.querySelector(".dropdown-content");
			content?.classList.remove("open");
		}
	};

	const handleClick = () => {
		if (node instanceof HTMLDialogElement) {
			node.showModal();
		} else if (node instanceof HTMLElement) {
			const content = node.classList.contains(".dropdown-content") ? node : node.querySelector(".dropdown-content");
			content?.classList.add("open");
		}
	};

	let above: Element | null = null;
	if (typeof window !== "undefined" && node instanceof HTMLElement) {
		window.addEventListener("click", handleWindowClick, true);
		above = node.previousElementSibling;
		if (above instanceof HTMLElement) {
			if (!(above instanceof HTMLButtonElement)) {
				above.setAttribute("tabindex", "0");
				node.addEventListener("keydown", handleClick);
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
