/** TODOC */
export interface SveltePopupElement {
	/** TODOC */
	get innerContainer(): HTMLDivElement | null;

	/** TODOC */
	get lastFocused(): HTMLElement | null;

	/** TODOC */
	showPopup(arg?: HTMLElement | null | { x: number; y: number }): Promise<void>;

	/** TODOC */
	close(): void;
}
