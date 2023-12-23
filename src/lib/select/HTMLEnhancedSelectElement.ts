import type { HTMLEnhancedOptionElement } from "$lib/select/HTMLEnhancedOptionElement.js";

/** TODOC */
export interface HTMLEnhancedSelectElement<T> {
	/** TODOC */
	name: string;

	/** The value of a non-multiple enhanced select */
	value: unknown | null;

	/** The values of a multiple enhanced select */
	values: (unknown | null)[];

	/** Reference to the options pool */
	pool: T[];

	/** Reference to the elements in body with a `value` attribute */
	options: HTMLEnhancedOptionElement<T>[];

	/** The search string */
	search: Record<string, HTMLInputElement>;

	/** The currently selected option */
	selectedIndex: number;

	/** TODOC */
	focus(): void;

	/** TODOC */
	showOptions(): void;

	/** TODOC */
	close(): void;
}
