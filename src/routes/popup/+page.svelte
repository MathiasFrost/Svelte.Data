<script lang="ts">
	import Popup from "$lib/popup/Popup.svelte";
	import ComboBox from "$lib/popup/ComboBox.svelte";
	import { fly } from "svelte/transition";
	import { SelectHelper } from "$lib/select/index.js";

	interface Option {
		readonly id: number;
		readonly name: string;
	}

	function randomOptions(count: number): Option[] {
		const options: Option[] = [];
		const names = [
			"Alpha",
			"Bravo",
			"Charlie",
			"Delta",
			"Echo",
			"Foxtrot",
			"Golf",
			"Hotel",
			"India",
			"Juliet",
			"Kilo",
			"Lima",
			"Mike",
			"November",
			"Oscar",
			"Papa",
			"Quebec",
			"Romeo",
			"Sierra",
			"Tango",
			"Uniform",
			"Victor",
			"Whiskey",
			"X-ray",
			"Yankee",
			"Zulu"
		];

		for (let i = 0; i < count; i++) {
			const randomName = names[Math.floor(Math.random() * names.length)];
			options.push({
				id: i + 1,
				name: `${randomName} ${Math.floor(Math.random() * 1000)}`
			});
		}

		return options;
	}

	const users = randomOptions(10);
</script>

<h1>Dialog</h1>

<p>
	This aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa is <Popup type="click" let:open
		><svelte:fragment slot="summary">something</svelte:fragment>
		{#if open}<div transition:fly class="popup">This is a tooltip wee woo wee woo wee woo</div>{/if}</Popup>
</p>

<ComboBox let:display let:value>
	<input type="text" readonly value={display + " " + (value ?? "")} />
	<ul>
		<li><data value="" /></li>
		<li><data value="0">Victor</data></li>
		<li><data value="1">Whiskey</data></li>
		<li><data value="2">Lima</data></li>
		<li><data value="3">Delta</data></li>
		<li><data value="4">Delta</data></li>
		<li><data value="5">Golf</data></li>
		<li><data value="6">November</data></li>
		<li><data value="7">India</data></li>
		<li><data value="8">India</data></li>
		<li><data value="9">Uniform</data></li>
	</ul>
</ComboBox>

<form on:submit|preventDefault={(e) => console.log(e)}>
	<ComboBox name="user" search={(inputs) => SelectHelper.defaultFilter(users, inputs)} let:options let:display>
		<input type="search" value={display} />
		<ul>
			<li><data value="" /></li>
			{#each options as user}
				<li><data value={user.id}>{user.name}</data></li>
			{/each}
		</ul>
	</ComboBox>
</form>

<form on:submit|preventDefault={(e) => console.log(e)}>
	<ComboBox name="user" search={(inputs) => SelectHelper.defaultFilter(users, inputs)} let:options let:display let:open>
		<Popup type="manual" {open}>
			<input slot="summary" type="search" value={display} />
			<ul class="popup">
				<li><data value="" /></li>
				{#each options as user}
					<li><data value={user.id}>{user.name}</data></li>
				{/each}
			</ul>
		</Popup>
	</ComboBox>
</form>

<select>
	<option>test</option>
</select>

<style lang="scss">
	.popup {
		background-color: #222222;
		color: #cccccc;
		padding: 0.3rem;
		margin: 0.3rem;
		border-radius: 0.3rem;
	}

	:global(.highlighted) {
		background-color: crimson;
	}
</style>
