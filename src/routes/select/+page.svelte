<script lang="ts">
	import EnhancedSelect from "$lib/select/EnhancedSelect.svelte";
	import type { HTMLEnhancedSelect } from "$lib/select/HTMLEnhancedSelect";

	/** TODOC */
	interface User {
		id: number;
		username: string;
		name: string;
	}

	/** TODOC */
	let select: HTMLEnhancedSelect<User, number> | undefined;

	/** TODOC */
	const users: User[] = [
		{ id: 1, name: "Mathias", username: "ML" },
		{ id: 2, name: "Ola", username: "OPB" },
		{ id: 3, name: "Josefine", username: "JMAL" },
		{ id: 4, name: "Midam", username: "MNAL" },
		{ id: 5, name: "Toni", username: "TB" },
		{ id: 6, name: "André", username: "ADr" },
		{ id: 7, name: "Napoleon", username: "NB" }
	];
</script>

<h1>Select</h1>

<EnhancedSelect bind:self={select} pool={users}>
	<input type="search" slot="input" let:onInput on:input={onInput} let:onKeydown on:keydown={onKeydown} />
	<ul slot="body" let:options let:isHighlighted>
		{#each options as option, i}
			<li class:highlighted={isHighlighted(i)}>{option.name}</li>
		{/each}
	</ul>
</EnhancedSelect>

<style>
	li.highlighted {
		background-color: #565454;
	}

	li.selected {
		background-color: #f1f1f1;
	}
</style>
