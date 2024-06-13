<script lang="ts">
	import Popup from "$lib/popup/Popup.svelte";
	import ComboBox, { getDefaultSearcher } from "$lib/popup/ComboBox.svelte";
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

	const pool = randomOptions(100);

	async function simulateSearch(inputs: Record<string, string>, signal: AbortSignal): Promise<Option[]> {
		console.log(inputs);
		if (!Object.keys(inputs).some((key) => !!inputs[key])) return [];

		await new Promise((resolve) => window.setTimeout(resolve, 2_000));
		// if (signal.aborted) throw new Error("Aborted");
		const res = SelectHelper.defaultFilter(pool, inputs);
		if (res.length) return res;
		return pool;
	}

	const users = randomOptions(10);

	const initial = pool[0];
</script>

<h1>Dialog</h1>

<p>
	This aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa is <Popup type="click" let:open
		><svelte:fragment slot="summary">something</svelte:fragment>
		{#if open}<div transition:fly class="popup">This is a tooltip wee woo wee woo wee woo</div>{/if}</Popup>
</p>

<ComboBox>
	<input type="text" readonly />
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
	<ComboBox name="user" search={getDefaultSearcher(users)} let:result>
		<input type="search" name="name" />
		<ul>
			<li><data value="" /></li>
			{#each result as user}
				<li><data value={user.id}>{user.name}</data></li>
			{/each}
		</ul>
	</ComboBox>
</form>

<form on:submit|preventDefault={(e) => console.log(e)}>
	<ComboBox name="user" search={simulateSearch} value={initial.id.toString()} let:result let:open let:promise>
		<Popup type="manual" {open}>
			<input slot="summary" type="search" value={initial.name} />
			<ul class="popup">
				{#await promise}
					<div class="spinner-overlay">
						<div class="spinner" />
					</div>
				{/await}
				<li><data value="" /></li>
				{#each result as user}
					<li><data value={user.id}>{user.name}</data></li>
				{/each}
			</ul>
		</Popup>
	</ComboBox>
</form>

<form on:submit|preventDefault={(e) => console.log(e)}>
	<ComboBox name="user" search={getDefaultSearcher(users.map((u) => u.name))} let:result>
		<input type="search" />
		<ul>
			<li><data value="" /></li>
			{#each result as user}
				<li><data value={user}>{user}</data></li>
			{/each}
		</ul>
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

	.spinner-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(34, 32, 32, 0.7); /* Semi-transparent overlay */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		border: 8px solid #f3f3f3;
		border-radius: 50%;
		border-top: 8px solid #3498db;
		width: 50px;
		height: 50px;
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
