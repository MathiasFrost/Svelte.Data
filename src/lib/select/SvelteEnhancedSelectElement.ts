/** TODOC */
export interface SvelteEnhancedSelectElement<T, K = string> {
	/** TODOC */
	get name(): string;

	/** The value of a non-multiple enhanced select */
	get value(): K | null;

	/** The values of a multiple enhanced select */
	get values(): (K | null)[];

	/** Reference to the options pool */
	get pool(): T[];

	/** Reference to the elements in body with a `value` attribute */
	get options(): HTMLDataElement[];

	/** The search string */
	get search(): Record<string, HTMLInputElement>;

	/** The currently selected option */
	get selectedIndex(): number;

	/** TODOC */
	focus(): void;

	/** TODOC */
	showOptions(): void;

	/** TODOC */
	close(): void;
}
