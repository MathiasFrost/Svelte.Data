<script lang="ts">
	import EnhancedSelect from "$lib/select/EnhancedSelect.svelte";
	import EnhancedOption from "$lib/select/EnhancedOption.svelte";
	import type { SvelteEnhancedSelectElement } from "$lib/select/SvelteEnhancedSelectElement.js";
	import "../../app.scss";

	/** TODOC */
	interface User {
		id: number;
		username: string;
		name: string;
	}

	/** TODOC */
	let select1: SvelteEnhancedSelectElement<User, number> | undefined;

	/** TODOC */
	let select2: SvelteEnhancedSelectElement<User, number> | undefined;

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

<h2>Native &lt;datalist&gt;</h2>
<input type="text" list="exampleList" />
<datalist id="exampleList">
	{#each users as user}
		<option value={user.name} />
	{/each}
</datalist>

<!--<h2>Multiple search props</h2>-->
<!--<p>Value: {select1?.value}, selectedIndex: {select1?.selectedIndex}, pool: {select1?.pool.length}</p>-->
<!--<form on:submit|preventDefault={onSubmit}>-->
<!--	<EnhancedSelect name="user" bind:self={select1} pool={users} value={3} force selectValue={(user) => user.id} let:registerOption let:filterOptions>-->
<!--		<svelte:fragment slot="summary" let:selected>-->
<!--			<input type="search" placeholder="Name" name="name" bind:this={input} value={selected?.name ?? ""} />-->
<!--			<input type="search" placeholder="Username" name="username" value={selected?.username ?? ""} />-->
<!--		</svelte:fragment>-->
<!--		<div class="selector">-->
<!--			<EnhancedOption {registerOption} />-->
<!--			{#each filterOptions(users) as user}-->
<!--				<EnhancedOption {registerOption} item={user}>{user.name}</EnhancedOption>-->
<!--			{/each}-->
<!--		</div>-->
<!--	</EnhancedSelect>-->
<!--	<button type="submit">submit</button>-->
<!--</form>-->

<h2>Simple</h2>
<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">
	<EnhancedSelect name="user" pool={users} value={3} key="id" force popup let:filterOptions>
		<svelte:fragment slot="summary" let:selected>
			<input type="search" placeholder="Employee" name="name" style="width: 100%;" value={selected?.name} />
		</svelte:fragment>
		<ul class="selector">
			<li><data value="" /></li>
			{#each filterOptions(users) as user}
				<li><data value={user.id} />{user.name}</li>
			{/each}
		</ul>
	</EnhancedSelect>
</form>

<!--<h2>Multiple</h2>-->
<!--<form on:submit|preventDefault={onSubmit} style="width: 100%;">-->
<!--	<EnhancedSelect name="users" bind:self={select2} pool={users} values={[3, 1]} selectValue={(user) => user.id} force multiple popup>-->
<!--		<div style="width: 100%;" slot="summary" let:checked>-->
<!--			<p>Selected: {checked.map((user) => user.username).join(", ")}{checked.length}</p>-->
<!--			<input type="search" style="width: 100%" placeholder="Employee" name="name" />-->
<!--		</div>-->
<!--		<svelte:fragment let:registerOption let:filterOptions let:allChecked>-->
<!--			{@const filtered = filterOptions(users)}-->
<!--			<div class="selector">-->
<!--				<EnhancedOption {registerOption} togglesAll>-->
<!--					<input tabindex="-1" type="checkbox" checked={allChecked} />-->
<!--					{#if allChecked}Uncheck all{:else}Check all{/if} ({filtered.length})-->
<!--				</EnhancedOption>-->
<!--				{#each filtered as user (user.id)}-->
<!--					<EnhancedOption {registerOption} item={user} let:checked><input tabindex="-1" type="checkbox" {checked} />{user.name}</EnhancedOption>-->
<!--				{/each}-->
<!--			</div>-->
<!--		</svelte:fragment>-->
<!--	</EnhancedSelect>-->
<!--	<button type="submit">submit</button>-->
<!--</form>-->

<!--<h2>Multiple with simple display</h2>-->
<!--<form on:submit|preventDefault={onSubmit} style="width: 100%;">-->
<!--	<EnhancedSelect name="users" bind:self={select2} pool={users} selectValue={(user) => user.id} values={[1, 3]} force multiple popup>-->
<!--		<svelte:fragment slot="summary" let:checked>-->
<!--			<input type="text" readonly style="width: 100%" value={checked.map((user) => user.username).join(", ")} />-->
<!--		</svelte:fragment>-->
<!--		<svelte:fragment let:registerOption let:filterOptions let:allChecked>-->
<!--			{@const filtered = filterOptions(users)}-->
<!--			<div class="selector">-->
<!--				<input type="search" placeholder="Employee" name="name" />-->
<!--				<input type="search" placeholder="Username" name="username" />-->
<!--				<EnhancedOption {registerOption} togglesAll>-->
<!--					<input tabindex="-1" type="checkbox" checked={allChecked} />-->
<!--					{#if allChecked}Uncheck all{:else}Check all{/if} ({filtered.length})-->
<!--				</EnhancedOption>-->
<!--				{#each filtered as user (user.id)}-->
<!--					<EnhancedOption {registerOption} item={user} let:checked><input tabindex="-1" type="checkbox" {checked} />{user.name}</EnhancedOption>-->
<!--				{/each}-->
<!--			</div>-->
<!--		</svelte:fragment>-->
<!--	</EnhancedSelect>-->
<!--	<button type="submit">submit</button>-->
<!--</form>-->

<!--<h2>Stylized select</h2>-->
<!--<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">-->
<!--	<EnhancedSelect name="user" pool={users} value={3} selectValue={(user) => user.id} let:registerOption popup>-->
<!--		<svelte:fragment slot="summary" let:selected>-->
<!--			<input type="text" readonly style="width: 100%;" name="name" value={selected?.name ?? ""} />-->
<!--		</svelte:fragment>-->
<!--		<div class="selector">-->
<!--			<EnhancedOption {registerOption} />-->
<!--			{#each users as user (user.id)}-->
<!--				<EnhancedOption {registerOption} item={user}>{user.name}</EnhancedOption>-->
<!--			{/each}-->
<!--		</div>-->
<!--	</EnhancedSelect>-->
<!--</form>-->

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
