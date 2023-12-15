/** TODOC */
export interface HTMLEnhancedOptionElement<T, K> {
	/** TODOC */
	value: K | null;

	/** TODOC */
	element: HTMLDivElement | null;

	/** TODOC */
	item: T | null;

	/** TODOC */
	togglesAll: boolean;

	/** TODOC */
	checked: boolean;

	/** TODOC */
	setChecked(value: boolean): void;
}
