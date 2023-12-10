/** TODOC */
export interface HTMLEnhancedSelect<T> {
	/** TODOC */
	name: string;

	/** The value of a non-multiple enhanced select */
	value: string;

	/** The values of a multiple enhanced select */
	values: string[];

	/** Reference to the options pool */
	pool: T[];

	/** Reference to the filtered options pool (what the user actually sees currently) */
	filtered: T[];

	/** Reference to the elements in body with a `value` attribute */
	options: HTMLElement[];

	/** The search string */
	search: Record<string, HTMLInputElement>;

	/** The currently selected option */
	selectedIndex: number;

	/** TODOC */
	focus(): void;

	/** TODOC */
	close(): void;
}
