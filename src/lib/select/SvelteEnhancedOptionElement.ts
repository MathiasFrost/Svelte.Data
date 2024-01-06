/** TODOC */
export interface SvelteEnhancedOptionElement<T> {
	/** TODOC */
	get value(): T | null;

	/** TODOC */
	get element(): HTMLDivElement | null;

	/** TODOC */
	get togglesAll(): boolean;

	/** TODOC */
	get checked(): boolean;

	/** TODOC */
	setChecked(value: boolean): void;
}
