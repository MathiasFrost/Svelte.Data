/** Options */
export interface HistoryManagerOptions {
	/** Called when manager wants to set the value we are tracking */
	onHistoryChange: (history: string[], index: number) => void;

	/** Limit how many changes can be stored */
	cap: number;
}

/** TODOC */
interface Action {
	element: HTMLElement;
	value: unknown;
}

/** TODOC */
const actionStack: Action[] = [];

/** TODOC */
let actionIndex = -1;

/** TODOC */
let customEvent = false;

/** TODOC */
function onKeyup(e: KeyboardEvent): void {
	if (e.ctrlKey && e.shiftKey && e.key === "Z") redo();
	else if (e.ctrlKey && e.key === "z") undo();
}

/** TODOC */
function onInput(e: Event): void {
	if (customEvent) return;
	let added = false;
	if (e.target instanceof HTMLInputElement) {
		if (e.target.type === "checkbox") actionStack.push({ element: e.target, value: e.target.checked });
		else actionStack.push({ element: e.target, value: e.target.value });
		added = true;
	}

	if (added) {
		if (actionIndex < actionStack.length - 2) actionStack.splice(0, actionStack.length - 1);
		actionIndex = actionStack.length - 1;
	}
}

/** TODOC */
function undo(): void {
	if (actionIndex >= 0) actionIndex--;
	setAction();
}

/** TODOC */
function redo(): void {
	if (actionIndex < actionStack.length - 1) actionIndex++;
	setAction();
}

/** TODOC */
function setAction(): void {
	const action = actionStack[actionIndex];
	if (!action) return;

	if (action.element instanceof HTMLInputElement) {
		if (action.element.type === "checkbox" && typeof action.value === "boolean") action.element.checked = action.value;
		else if (typeof action.value === "string") action.element.value = action.value;

		customEvent = true;
		const event = new Event("change", { bubbles: true, cancelable: true });
		action.element.dispatchEvent(event);
		customEvent = false;
	}
}

/** TODOC */
export function history(node: Node): { destroy: () => void } {
	if (node instanceof HTMLElement && typeof window !== "undefined") {
		window.addEventListener("keyup", onKeyup);
		node.addEventListener("input", onInput);
	}
	return {
		destroy() {
			if (node instanceof HTMLElement && typeof window !== "undefined") {
				window.removeEventListener("keyup", onKeyup);
				node.removeEventListener("input", onInput);
			}
		}
	};
}

/** TODOC */
export function emitRedo(): void {
	if (typeof window === "undefined") return;
	const event = new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: "Z", shiftKey: true, ctrlKey: true });
	window.dispatchEvent(event);
}

/** TODOC */
export function emitUndo(): void {
	if (typeof window === "undefined") return;
	const event = new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: "z", ctrlKey: true });
	window.dispatchEvent(event);
}
