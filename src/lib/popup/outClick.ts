/** TODOC */
export function outClick(node: Node, handler: (e: Event) => void): { destroy: () => void } {
	const handleClick = (event: MouseEvent): void => {
		const display = node instanceof HTMLElement ? window.getComputedStyle(node).getPropertyValue("display") : "none";
		if (display !== "none" && !(event.x === 0 && event.y === 0) && event.target instanceof Node && !node.contains(event.target)) {
			handler(event);
		}
	};

	document.addEventListener("click", handleClick, true);

	return {
		destroy() {
			document.removeEventListener("click", handleClick, true);
		}
	};
}
