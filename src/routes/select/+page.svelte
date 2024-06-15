<script lang="ts">
	import "../../app.scss";
	import ComboBox, { makeDefaultSearcher } from "$lib/popup/ComboBox.svelte";
	import Popup from "$lib/popup/Popup.svelte";

	/** TODOC */
	interface User {
		id: number;
		username: string;
		name: string;
	}

	/** TODOC */
	let select1: ComboBox<User> | undefined;

	/** TODOC */
	let select2: ComboBox<User> | undefined;

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

<h2>Multiple search props</h2>
<p>Value: {select1?.value}, selectedIndex: {select1?.selectedIndex}</p>
<form on:submit|preventDefault={onSubmit}>
	<ComboBox name="user" bind:this={select1} value={"3"} search={makeDefaultSearcher(users)} let:result>
		<input type="search" placeholder="Name" name="name" bind:this={input} />
		<input type="search" placeholder="Username" name="username" />
		<ul style="list-style: none; padding: 0;" class="selector">
			<li><data value="" />&nbsp;</li>
			{#each result as user}
				<li><data value={user.id} />{user.name}</li>
			{/each}
		</ul>
	</ComboBox>
	<button type="submit">submit</button>
</form>

<!--<h2>Simple</h2>-->
<!--<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">-->
<!--	<ComboBox name="user" search={makeDefaultSearcher(users)} value={"3"} let:result let:open>-->
<!--		<Popup type="manual" {open}>-->
<!--			<input slot="summary" type="search" placeholder="Employee" name="name" style="width: 100%;" value={""} />-->
<!--			<ul style="list-style: none; padding: 0;" class="selector">-->
<!--				<li><data value="" />&nbsp;</li>-->
<!--				{#each result as user}-->
<!--					<li><data value={user.id} />{user.name}</li>-->
<!--				{/each}-->
<!--			</ul>-->
<!--		</Popup>-->
<!--	</ComboBox>-->
<!--</form>-->

<h2>Multiple</h2>
<form on:submit|preventDefault={onSubmit} style="width: 100%;">
	<ComboBox
		name="users"
		bind:this={select2}
		search={makeDefaultSearcher(users)}
		values={["3", "1"]}
		valuesText={[
			{ name: "Mathias", username: "ML" },
			{ name: "Josefine", username: "JMAL" }
		]}
		multiple
		let:open
		let:values
		let:valuesText
		let:result
		let:all>
		{result.length}
		<Popup type="manual" {open}>
			<div style="width: 100%;" slot="summary">
				<p>Selected: {valuesText.map((user) => user.username).join(", ")} {values.length} {JSON.stringify(valuesText)}</p>
				<input type="search" style="width: 100%" placeholder="Employee" name="name" />
			</div>
			<ul style="list-style: none; padding: 0;" class="selector">
				<li>
					<data value="[TOGGLE]" />
					<input tabindex="-1" type="checkbox" checked={all} />
					{#if all}Uncheck all{:else}Check all{/if} ({result.length})
				</li>
				{#each result as user}
					<li><data value={user.id} /><input tabindex="-1" type="checkbox" checked={values.includes(user.id.toString())} />{user.name}</li>
				{/each}
			</ul>
		</Popup>
	</ComboBox>
	<button type="submit">submit</button>
</form>

<!--<h2>Multiple with simple display</h2>-->
<!--<form on:submit|preventDefault={onSubmit} style="width: 100%;">-->
<!--	<ComboBox name="users" bind:this={select2} search={makeDefaultSearcher(users)} values={["1", "3"]} multiple let:result let:open let:valuesText let:all>-->
<!--		<Popup type="manual" {open}>-->
<!--			<svelte:fragment slot="summary">-->
<!--				<div role="listbox" class="input" tabindex="0">-->
<!--					{JSON.stringify(valuesText)}-->
<!--					&lt;!&ndash;{#each values.map((value, i) => ({ value, text: valuesText[i] })) as { value, text }}&ndash;&gt;-->
<!--					&lt;!&ndash;						<button><data {value}>{text.username}</data></button>&ndash;&gt;-->
<!--					&lt;!&ndash;					{/each}&ndash;&gt;-->
<!--				</div>-->
<!--			</svelte:fragment>-->
<!--			<div class="selector">-->
<!--				<input type="search" placeholder="Employee" name="name" />-->
<!--				<input type="search" placeholder="Username" name="username" />-->
<!--				<ul style="list-style: none; padding: 0;">-->
<!--					<li>-->
<!--						<data value="[TOGGLE]" />-->
<!--						<input tabindex="-1" type="checkbox" checked={all} />-->
<!--						{#if all}Uncheck all{:else}Check all{/if} ({result.length})-->
<!--					</li>-->
<!--					{#each result as user}-->
<!--						<li><data value={user.id} /><input tabindex="-1" type="checkbox" checked={result.includes(user)} />{user.name}</li>-->
<!--					{/each}-->
<!--				</ul>-->
<!--			</div>-->
<!--		</Popup>-->
<!--	</ComboBox>-->
<!--	<button type="submit">submit</button>-->
<!--</form>-->

<!--<h2>Stylized select</h2>-->
<!--<form on:submit|preventDefault={onSubmit} class="dropdown right-dropdown" style="width: 100%;">-->
<!--	<ComboBox name="user" value={"3"} let:open>-->
<!--		<Popup type="manual" {open}>-->
<!--			<input slot="summary" type="text" readonly style="width: 100%;" name="name" />-->
<!--			<ul style="list-style: none; padding: 0;" class="selector">-->
<!--				<li><data value="" />&nbsp;</li>-->
<!--				{#each users as user}-->
<!--					<li><data value={user.id} />{user.name}</li>-->
<!--				{/each}-->
<!--			</ul>-->
<!--		</Popup>-->
<!--	</ComboBox>-->
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
