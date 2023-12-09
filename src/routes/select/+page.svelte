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
	let select: HTMLEnhancedSelect<User> | undefined;

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

	/** TODOC */
	let selectValue: number | undefined = void 0;

	/** TODOC */
	let nativeSelect: HTMLSelectElement | null = null;

	/** TODOC */
	let input: HTMLInputElement | null = null;

	// TODOC
	$: if (input) input.focus();
</script>

<h1>Select</h1>

<p>Value: {selectValue} {typeof selectValue}</p>
<select bind:value={selectValue} bind:this={nativeSelect}>
	{#each users as option}
		<option value={option.id}>{option.name}</option>
	{/each}
</select>

<p>Value: {select?.value}, selectedIndex: {select?.selectedIndex}</p>
<EnhancedSelect bind:self={select} pool={users}>
	<svelte:fragment slot="search">
		<input type="search" bind:this={input} />
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
