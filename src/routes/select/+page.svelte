<script lang="ts">
	let selecteds: number[] = [];
	let selected: number | null = null;
	let selectedCombo: number | null = null;

	const options: { value: number; text: string }[] = [];
	for (let i = 0; i < 10; i++) {
		options.push({ value: i, text: `Option #${i}` });
	}
	let search = "";
	let filtered = [...options];
	$: if (typeof search === "string") {
		filtered = options.filter((o) => o.text.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
	}
</script>

<h1>Svelte.StoresPlus</h1>

<h2>custom select</h2>

<div style="margin: 1rem">
	<label
		>Multiple
		<select multiple bind:value={selecteds} title="Ctrl-click to select multiple">
			{#each options as option}
				<option class:selected={selecteds.includes(option.value)} value={option.value}>{option.text}</option>
			{/each}
		</select>
	</label>
	<div>
		{selecteds.join(", ")}
	</div>
	<br />
	<label
		>Single
		<select bind:value={selected}>
			{#each options as option}
				<option class:selected={selected === option.value} value={option.value}>{option.text}</option>
			{/each}
		</select>
	</label>
	<div>
		{selected}
	</div>
	<br />
	<label
		>Combo
		<input type="search" bind:value={search} class="select-input" />
		<select size="4" bind:value={selectedCombo}>
			{#each filtered as option}
				<option class:selected={selectedCombo === option.value} value={option.value}>{option.text}</option>
			{/each}
		</select>
	</label>
	<div>
		{selectedCombo}
	</div>
</div>

<style lang="scss">
	.select-input {
		width: 90%;
		display: block;
		padding: 0.6rem 1rem;
		font-size: 1rem;
		color: rgb(228, 228, 228);
		background-color: rgb(15, 15, 16);
		border: none;

		&:focus {
			outline: none;
		}
	}

	select {
		display: block;
		width: 90%;
		background-color: rgb(53, 53, 53);
		border-radius: 0.3rem;
		border: none;
		border-left: 1px solid rgb(31, 31, 33);

		&:not([multiple]):not([size]) {
			padding: 0.6rem 1rem;
			font-size: 1rem;
			color: rgb(228, 228, 228);
			background-color: rgb(15, 15, 16);
			border: none;

			option.selected {
				color: cyan;
			}
		}

		option {
			padding: 0.3rem 0.6rem;
			background-color: rgb(15, 15, 16);
			color: rgb(228, 228, 228);
			font-size: 1rem;
			border-bottom: 1px solid rgb(31, 31, 33);

			&.selected {
				background: radial-gradient(rgba(96, 161, 175, 0.457), rgba(0, 255, 255, 0.385));
			}
		}
	}
</style>
