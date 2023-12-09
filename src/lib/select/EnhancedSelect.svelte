<script lang="ts">
	import type { HTMLEnhancedSelect } from "$lib/select/HTMLEnhancedSelect";

	/** TODOC */
	type T = $$Generic;

	/** TODOC */
	type K = $$Generic;

	/** TODOC */
	export let pool: T[] = [];

	/** TODOC */
	export let getValue: (item: T) => K = (item) => item as unknown as K;

	/** TODOC */
	export let getText: (item: T) => string = (item) => `${item}`;

	/** TODOC */
	export let getSearch: (item: T) => string = (item) => JSON.stringify(item);

	/** TODOC */
	export const self: HTMLEnhancedSelect<T, K> = {
		value: null,
		values: [],
		pool,
		options: pool,
		selectedIndex: 0
	};

	/** TODOC */
	let hovered = self.selectedIndex;

	/** TODOC */
	function onKeydown(e: KeyboardEvent): void {
		switch (e.key) {
			case "ArrowUp":
				if (self.selectedIndex <= 0) self.selectedIndex = self.options.length - 1;
				else self.selectedIndex--;
				break;
			case "ArrowDown":
				if (self.selectedIndex >= self.options.length - 1) self.selectedIndex = 0;
				else self.selectedIndex++;
				break;
		}
		hovered = self.selectedIndex;
		console.log(hovered);
	}

	/** TODOC */
	function onInput(this: HTMLInputElement): void {
		self.search = this.value;
	}

	/** TODOC */
	function getOptions(pool: T[], search: string): T[] {
		return pool.filter((item) => !search || getSearch(item).toLowerCase().includes(search.toLowerCase()));
	}

	/** TODOC */
	function getIsHighlighted(hovered: number): (i: number) => boolean {
		return (i) => i === hovered;
	}

	/** TODOC */
	function getOnMouseover(): (this: HTMLInputElement, i: number) => void {
		return (i) => {
			console.log(i);
			hovered = i;
		};
	}

	/** TODOC */
	let childComponents: HTMLElement[] = [];

	/** TODOC */
	function registerOption(this: HTMLElement) {
		console.log(this);
		childComponents.push(this);
	}
</script>

<slot name="input" {onInput} {onKeydown} />
<slot name="body" options={getOptions(self.pool, self.search)} {registerOption} />
