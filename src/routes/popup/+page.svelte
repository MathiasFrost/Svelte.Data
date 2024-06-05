<script lang="ts">
	import Popup from "$lib/popup/Popup.svelte";
	import ComboBox from "$lib/popup/ComboBox.svelte";

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
</script>

<h1>Dialog</h1>

<p>
	This aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa is <Popup type="click"
		><svelte:fragment slot="summary">something</svelte:fragment>
		<div class="popup">This is a tooltip wee woo wee woo wee woo</div></Popup>
</p>

<ComboBox getter={() => randomOptions(10)} let:options>
	<input slot="summary" type="search" />
	<ul>
		{#each options as option, i}
			<li><data value={i} />{option.name}</li>
		{/each}
	</ul>
</ComboBox>

<style lang="scss">
	.popup {
		background-color: #222222;
		color: #cccccc;
		padding: 0.3rem;
		margin: 0.3rem;
		border-radius: 0.3rem;
	}
</style>
