/** TODOC */
export interface HTMLEnhancedSelect<T, K> {
	/** The value of a non-multiple enhanced select */
	value: K | null;

	/** The values of a multiple enhanced select */
	values: K[];

	/** Reference to the options pool */
	pool: T[];

	/** Reference to the filtered options pool (what the user actually sees currently) */
	filtered: T[];

	/** Reference to the elements in body with a `value` attribute */
	options: HTMLElement[];

	/** The search string */
	search: Record<string, string>;

	/** The currently selected option */
	selectedIndex: number;
}
