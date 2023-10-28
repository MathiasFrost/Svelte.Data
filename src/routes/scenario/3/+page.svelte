<script lang="ts">
	import { emitRedo, emitUndo, history } from "$lib/history/history.js";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
	import type { PageData } from "./$types.js";
	import { CookieSyncer } from "$lib/sync";

	/** @inheritdoc */
	export let data: PageData;

	/** Store history in local storage */
	const local = new CookieSyncer<(string | null)[]>(
		"history",
		data.forecasts.map((f) => f.summary),
		{}
	);

	let forecasts: WeatherForecast[] = data.forecasts;
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 3</h2>
<p>Server loaded data with refresh and history</p>

<button on:click={() => emitUndo()}> undo</button>
<button on:click={() => emitRedo()}> redo</button>
<button on:click={() => local.clear()}> clear history</button>

<table use:history>
	<thead>
		<tr>
			<th>Summary</th>
			<th>Date</th>
			<th>TemperatureC</th>
			<th>TemperatureF</th>
		</tr>
	</thead>
	<tbody>
		{#each forecasts as forecast}
			<tr>
				<td><input type="text" bind:value={forecast.summary} /></td>
				<td>{forecast.date.toLocaleString()}</td>
				<td>{forecast.temperatureC}</td>
				<td>{forecast.temperatureF}</td>
			</tr>
		{/each}
	</tbody>
</table>
