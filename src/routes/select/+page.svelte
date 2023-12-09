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
<form on:submit|preventDefault={(e) => console.log(new FormData(e.target))} class="dropdown right-dropdown">
	<EnhancedSelect name="user" bind:self={select} pool={users} key="id" value="2">
		<svelte:fragment slot="search">
			<input type="search" name="name" bind:this={input} />
			<input type="search" name="username" />
		</svelte:fragment>
		<svelte:fragment slot="options" let:options>
			<div class="dropdown-content">
				<ul class="selector">
					<li value={null} />
					{#each options as option}
						<li value={option.id}>{option.name}</li>
					{/each}
				</ul>
			</div>
		</svelte:fragment>
	</EnhancedSelect>
	<button type="submit">submit</button>
</form>

<style>
	:global(.highlighted) {
		background-color: #363535;
	}

	.selector {
		margin: 1rem;
		border: 1px solid crimson;
		overflow-y: auto;
		max-height: 4rem;
		width: 100%;
	}

	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-content {
		position: absolute;
		display: flex;
		width: 100%;
		min-width: 4rem;
		z-index: 1;
		max-height: 40rem;
	}
</style>
