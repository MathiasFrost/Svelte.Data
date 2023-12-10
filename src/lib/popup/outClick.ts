import { PopupHelper } from "$lib/popup/PopupHelper.js";

/** TODOC */
export function outClick(node: Node, handler: (e: Event) => void): { destroy: () => void } {
	const handleClick = (event: MouseEvent): void => {
		if (PopupHelper.isOutsideClick(event, node)) {
			handler(event);
		}
	};

	if (typeof window !== "undefined") {
		window.addEventListener("click", handleClick, true);
	}

	return {
		destroy() {
			if (typeof window !== "undefined") {
				window.removeEventListener("click", handleClick, true);
			}
		}
	};
}
