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
		{ id: 1, name: "Mathias Amandus Andvik Løken", username: "ML" },
		{ id: 2, name: "Ola Putten Bredviken", username: "OPB" },
		{ id: 3, name: "Josefine Andvik Løken", username: "JMAL" },
		{ id: 4, name: "Midam Brænden", username: "MNAL" },
		{ id: 5, name: "Toni Brænden", username: "TB" },
		{ id: 6, name: "André Drent", username: "ADr" },
		{ id: 7, name: "Napoleon Bonaparte", username: "NB" }
	];
</script>

<h1>Select</h1>

<select>
	{#each users as option, i}
		<option>{option.name}</option>
	{/each}
</select>

<p>Value: {select?.values}, selectedIndex: {select?.selectedIndex}</p>
<EnhancedSelect bind:self={select} pool={users}>
	<svelte:fragment slot="search">
		<input type="search" />
		<input type="search" name="username" />
	</svelte:fragment>
	<ul slot="options" class="selector" let:options>
		<li value={null} />
		{#each options as option}
			<li value={option.id}>{option.name}</li>
		{/each}
	</ul>
</EnhancedSelect>

<style>
	:global(.highlighted) {
		background-color: #363535;
	}

	.selector {
		max-height: 3rem;
		overflow-y: auto;
	}
</style>
