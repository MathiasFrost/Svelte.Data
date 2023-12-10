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
	let select1: HTMLEnhancedSelect<User> | undefined;

	/** TODOC */
	let select2: HTMLEnhancedSelect<User> | undefined;

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
<p>Value: {select1?.value}, selectedIndex: {select1?.selectedIndex}</p>
<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown">
	<EnhancedSelect name="user" bind:self={select1} pool={users} key="id" value="3" force>
		<svelte:fragment slot="search">
			<input type="search" placeholder="Name" name="name" bind:this={input} />
			<input type="search" placeholder="Username" name="username" />
		</svelte:fragment>
		<div slot="options" class="dropdown-content" let:options>
			<udiv class="selector">
				<option value={null} />
				{#each options as option}
					<option value={option.id}>{option.name}</option>
				{/each}
			</udiv>
		</div>
	</EnhancedSelect>
	<button type="submit">submit</button>
</form>

<h2>Simple</h2>
<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">
	<EnhancedSelect name="user" pool={users} key="id" value="3" force>
		<input slot="search" type="search" placeholder="Employee" name="name" style="width: 100%;" />
		<div slot="options" class="dropdown-content" let:options>
			<div class="selector">
				<option value={null} />
				{#each options as option}
					<option value={option.id}>{option.name}</option>
				{/each}
			</div>
		</div>
	</EnhancedSelect>
</form>

<h2>Multiple</h2>
<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">
	<EnhancedSelect name="users" bind:self={select2} pool={users} key="id" value="3" force multiple>
		<div slot="search" style="width: 100%;" let:isChecked>
			<p>Selected: {users.filter((user) => isChecked(user)).map((user) => user.username)}</p>
			<input type="search" style="width: 100%" placeholder="Employee" name="name" />
		</div>
		<div slot="options" class="dropdown-content" let:options let:isChecked let:allChecked>
			<div class="selector">
				<option value={null}>
					<input tabindex="-1" type="checkbox" checked={allChecked()} />
					{#if allChecked()}Uncheck all{:else}Check all{/if} ({options.length})
				</option>
				{#each options as option}
					<option value={option.id}><input tabindex="-1" type="checkbox" checked={isChecked(option)} />{option.name}</option>
				{/each}
			</div>
		</div>
	</EnhancedSelect>
	<button type="submit">submit</button>
</form>

<h2>Multiple with simple display</h2>
<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">
	<EnhancedSelect name="users" bind:self={select2} pool={users} key="id" value="3" force multiple>
		<input
			slot="display"
			type="text"
			readonly
			style="width: 100%"
			let:isChecked
			value={users
				.filter(isChecked)
				.map((user) => user.username)
				.join(", ")} />
		<input slot="search" type="search" style="width: 100%" placeholder="Employee" name="name" />
		<div slot="options" class="dropdown-content" let:options let:isChecked let:allChecked>
			<div class="selector">
				<option value={null}>
					<input tabindex="-1" type="checkbox" checked={allChecked()} />
					{#if allChecked()}Uncheck all{:else}Check all{/if} ({options.length})
				</option>
				{#each options as option}
					<option value={option.id}><input tabindex="-1" type="checkbox" checked={isChecked(option)} />{option.name}</option>
				{/each}
			</div>
		</div>
	</EnhancedSelect>
	<button type="submit">submit</button>
</form>

<h2>Stylized select</h2>
<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">
	<EnhancedSelect name="user" pool={users} key="id" value="3">
		<input slot="search" type="search" readonly let:isChecked value={users.find(isChecked)?.name} />
		<div slot="options" class="dropdown-content" let:options>
			<div class="selector">
				<option value={null} />
				{#each options as option}
					<option value={option.id}>{option.name}</option>
				{/each}
			</div>
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
		overflow-y: auto;
		max-height: 4rem;
		width: 100%;
		background-color: #242425;
	}

	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-content {
		position: absolute;
		z-index: 999;
		display: flex;
		width: 100%;
		min-width: 4rem;
		max-height: 40rem;
	}
</style>
