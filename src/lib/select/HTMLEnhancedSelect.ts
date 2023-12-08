/** TODOC */
export interface HTMLEnhancedSelect<T, K> {
	value: K | null;
	values: K[];
	pool: T[];
	options: T[];
	search: string;
	selectedIndex: number;
}
