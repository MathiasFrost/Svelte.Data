import { PopupHelper } from "$lib/popup/PopupHelper.js";

/** TODOC */
export function outClick(node: Node, handler: (e: MouseEvent) => void): { destroy: () => void } {
	let isOutside = false;

	function handleClick(e: MouseEvent): void {
		if (!isOutside && PopupHelper.isOutsideClick(e, node)) {
			handler(e);
		}
		isOutside = false;
	}

	/** start tracking mouse */
	function startTracking(e: Event): void {
		if (typeof window === "undefined") return;
		if (e instanceof MouseEvent && PopupHelper.isOutsideClick(e, node)) return;
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", stopTracking);
	}

	/** cleanup */
	function stopTracking(): void {
		if (typeof window === "undefined") return;
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mouseup", stopTracking);
	}

	/** TODOC */
	function handleMouseMove(e: MouseEvent): void {
		// Check if the mouse is outside the container
		if (PopupHelper.isOutsideClick(e, node)) {
			isOutside = true;
		}
	}

	if (typeof window !== "undefined") {
		window.addEventListener("click", handleClick, true);
		node.addEventListener("mousedown", startTracking);
	}

	return {
		destroy() {
			if (typeof window !== "undefined") {
				window.removeEventListener("click", handleClick, true);
				node.removeEventListener("mousedown", startTracking);
			}
		}
	};
}

/** TODOC */
export function multiOutClick(nodes: Node[], handler: (e: MouseEvent) => void): { destroy: () => void } {
	let isOutsides: boolean[] = nodes.map(() => false);
	const startTrackingFunctions = nodes.map((node, i) => getStartTracking(node, i));
	const handleMouseMoveFunctions = nodes.map((node, i) => getHandleMouseMove(node, i));
	const stopTrackingFunctions = nodes.map((_, i) => getStopTracking(i));

	function handleClick(e: MouseEvent): void {
		if (isOutsides.every((val) => !val) && nodes.every((node) => PopupHelper.isOutsideClick(e, node))) {
			handler(e);
		}
		isOutsides = nodes.map(() => false);
	}

	/** start tracking mouse */
	function getStartTracking(node: Node, i: number): (e: Event) => void {
		return (e) => {
			if (typeof window === "undefined") return;
			if (e instanceof MouseEvent && PopupHelper.isOutsideClick(e, node)) return;
			window.addEventListener("mousemove", handleMouseMoveFunctions[i]);
			window.addEventListener("mouseup", stopTrackingFunctions[i]);
		};
	}

	/** cleanup */
	function getStopTracking(i: number): () => void {
		return () => {
			if (typeof window === "undefined") return;
			window.removeEventListener("mousemove", handleMouseMoveFunctions[i]);
			window.removeEventListener("mouseup", stopTrackingFunctions[i]);
		};
	}

	/** TODOC */
	function getHandleMouseMove(node: Node, i: number): (e: MouseEvent) => void {
		return (e) => {
			// Check if the mouse is outside the container
			if (PopupHelper.isOutsideClick(e, node)) {
				isOutsides[i] = true;
			}
		};
	}

	if (typeof window !== "undefined") {
		window.addEventListener("click", handleClick, true);
		nodes.forEach((node, i) => node.addEventListener("mousedown", startTrackingFunctions[i]));
	}

	return {
		destroy() {
			if (typeof window !== "undefined") {
				window.removeEventListener("click", handleClick, true);
				nodes.forEach((node, i) => node.removeEventListener("mousedown", startTrackingFunctions[i]));
			}
		}
	};
}
