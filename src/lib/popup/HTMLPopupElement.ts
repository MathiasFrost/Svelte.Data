/** TODOC */
export interface HTMLPopupElement {
	/** TODOC */
	innerContainer: HTMLDivElement | null;

	/** TODOC */
	showPopup(arg?: HTMLElement | null | { x: number; y: number }): Promise<void>;

	/** TODOC */
	close(): void;
}
