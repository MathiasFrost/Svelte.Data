/** TODOC */
export interface HTMLPopupElement {
	/** TODOC */
	popupContainer: HTMLDivElement | null;

	/** TODOC */
	child: HTMLDivElement | null;

	/** TODOC */
	showPopup(arg?: HTMLElement | null | { x: number; y: number }): Promise<void>;

	/** TODOC */
	close(): void;
}
