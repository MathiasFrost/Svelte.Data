/** TODOC */
export interface HTMLPopupElement {
	/** TODOC */
	popupContainer: HTMLDivElement | null;

	/** TODOC */
	showPopup(arg?: HTMLElement | null | { x: number; y: number }): void;

	/** TODOC */
	close(): void;
}
