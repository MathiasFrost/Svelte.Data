import type { HTMLEnhancedOptionElement } from "$lib/select/HTMLEnhancedOptionElement.js";

/** TODOC */
export interface HTMLEnhancedSelectElement<T, K> {
	/** TODOC */
	name: string;

	/** The value of a non-multiple enhanced select */
	value: K | null;

	/** The values of a multiple enhanced select */
	values: (K | null)[];

	/** Reference to the options pool */
	pool: T[];

	/** Reference to the filtered options pool (what the user actually sees currently) */
	filtered: T[];

	/** Reference to the elements in body with a `value` attribute */
	options: HTMLEnhancedOptionElement<T, K>[];

	/** The search string */
	search: Record<string, HTMLInputElement>;

	/** The currently selected option */
	selectedIndex: number;

	/** TODOC */
	focus(): void;

	/** TODOC */
	close(): void;
}
