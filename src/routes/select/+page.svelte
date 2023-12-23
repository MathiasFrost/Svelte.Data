<script lang="ts">
	import EnhancedSelect from "$lib/select/EnhancedSelect.svelte";
	import type { HTMLEnhancedSelectElement } from "$lib/select/HTMLEnhancedSelectElement";
	import EnhancedOption from "$lib/select/EnhancedOption.svelte";

	/** TODOC */
	interface User {
		id: number;
		username: string;
		name: string;
	}

	/** TODOC */
	let select1: HTMLEnhancedSelectElement<User> | undefined;

	/** TODOC */
	let select2: HTMLEnhancedSelectElement<User> | undefined;

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

	/** TODOC */
	function onSubmit(this: HTMLFormElement): void {
		console.log(new FormData(this));
	}
</script>

<h2>Native select</h2>
<p>Value: {selectValue} {typeof selectValue}</p>
<select bind:value={selectValue} bind:this={nativeSelect}>
	{#each users as option}
		<option value={option.id}>{option.name}</option>
	{/each}
</select>

<h2>Multiple search props</h2>
<p>Value: {select1?.value}, selectedIndex: {select1?.selectedIndex}, pool: {select1?.pool.length}</p>
<form on:submit|preventDefault={onSubmit}>
	<EnhancedSelect name="user" bind:self={select1} pool={users} value={3} force let:registerOption let:filterOptions>
		<svelte:fragment slot="summary" let:pool let:value>
			{@const selected = pool.find((user) => user.id === value)}
			<input type="search" placeholder="Name" name="name" bind:this={input} value={selected?.name ?? ""} />
			<input type="search" placeholder="Username" name="username" value={selected?.username ?? ""} />
		</svelte:fragment>
		<div class="selector">
			<EnhancedOption {registerOption} />
			{#each filterOptions(users) as user}
				<EnhancedOption {registerOption} value={user.id} item={user}>{user.name}</EnhancedOption>
			{/each}
		</div>
	</EnhancedSelect>
	<button type="submit">submit</button>
</form>

<h2>Simple</h2>
<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">
	<EnhancedSelect name="user" pool={users} value={3} force popup let:registerOption let:filterOptions>
		<input slot="summary" type="search" placeholder="Employee" name="name" style="width: 100%;" />
		<div class="selector">
			<EnhancedOption {registerOption} />
			{#each filterOptions(users) as user}
				<EnhancedOption {registerOption} value={user.id} item={user}>{user.name}</EnhancedOption>
			{/each}
		</div>
	</EnhancedSelect>
</form>

<h2>Multiple</h2>
<form on:submit|preventDefault={onSubmit} style="width: 100%;">
	<EnhancedSelect name="users" bind:self={select2} pool={users} values={[3, 1]} force multiple popup>
		<div style="width: 100%;" slot="summary" let:pool let:values>
			{@const filtered = pool.filter((user) => values.includes(user.id))}
			<p>Selected: {filtered.map((user) => user.username).join(", ")}{filtered.length}</p>
			<input type="search" style="width: 100%" placeholder="Employee" name="name" />
		</div>
		<svelte:fragment let:registerOption let:filterOptions let:allChecked>
			{@const filtered = filterOptions(users)}
			<div class="selector">
				<EnhancedOption {registerOption} togglesAll>
					<input tabindex="-1" type="checkbox" checked={allChecked} />
					{#if allChecked}Uncheck all{:else}Check all{/if} ({filtered.length})
				</EnhancedOption>
				{#each filtered as user (user.id)}
					<EnhancedOption {registerOption} value={user.id} item={user} let:checked
						><input tabindex="-1" type="checkbox" {checked} />{user.name}</EnhancedOption>
				{/each}
			</div>
		</svelte:fragment>
	</EnhancedSelect>
	<button type="submit">submit</button>
</form>

<h2>Multiple with simple display</h2>
<form on:submit|preventDefault={onSubmit} style="width: 100%;">
	<EnhancedSelect name="users" bind:self={select2} pool={users} values={[1, 3]} force multiple popup>
		<svelte:fragment slot="summary" let:values let:pool>
			{@const filtered = pool.filter((user) => values.includes(user.id))}
			<input type="text" readonly style="width: 100%" value={filtered.map((user) => user.username).join(", ")} />
		</svelte:fragment>
		<svelte:fragment let:registerOption let:filterOptions let:allChecked>
			{@const filtered = filterOptions(users)}
			<div class="selector">
				<input type="search" placeholder="Employee" name="name" />
				<input type="search" placeholder="Username" name="username" />
				<EnhancedOption {registerOption} togglesAll>
					<input tabindex="-1" type="checkbox" checked={allChecked} />
					{#if allChecked}Uncheck all{:else}Check all{/if} ({filtered.length})
				</EnhancedOption>
				{#each filtered as user (user.id)}
					<EnhancedOption {registerOption} value={user.id} item={user} let:checked
						><input tabindex="-1" type="checkbox" {checked} />{user.name}</EnhancedOption>
				{/each}
			</div>
		</svelte:fragment>
	</EnhancedSelect>
	<button type="submit">submit</button>
</form>

<h2>Stylized select</h2>
<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">
	<EnhancedSelect name="user" pool={users} value={3} let:registerOption popup>
		<input slot="summary" type="text" readonly style="width: 100%;" name="name" />
		<div class="selector">
			<EnhancedOption {registerOption} />
			{#each users as user (user.id)}
				<EnhancedOption {registerOption} value={user.id} item={user}>{user.name}</EnhancedOption>
			{/each}
		</div>
	</EnhancedSelect>
</form>

<style>
	:global(.highlighted) {
		background-color: #363535;
	}

	.selector {
		margin: 1rem;
		border: 1px solid crimson;
		background-color: #242425;
		overflow-y: auto;
		max-height: 4rem !important;
	}
</style>
