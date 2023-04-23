<script lang="ts">
	import type { MaybePromise } from "$app/forms";
	import { AsyncData } from "$lib/async/AsyncData.js";
	import { HistoryManager } from "$lib/history/HistoryManager.js";
	import { LocalStorageSyncer } from "$lib/sync/LocalStorageSyncer.js";
	import { anyTransformer, stringTransformer } from "$lib/types/transformers.js";
	import { ensureArray } from "$lib/types/unknown.js";
	import { TestClient } from "$sandbox/http/TestClient.js";
	import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
	import type { PageData } from "./$types.js";

	/** */
	export let data: PageData;

	/** */
	let forecasts: MaybePromise<WeatherForecast[]> = data.forecasts;
	const forecastData = new AsyncData({
		promiseFactory: () => TestClient.getForecasts(),
		cooldown: 2_000,
		onResolved: (res) => (forecasts = res),
		onReject: (e) => (forecasts = Promise.reject(e))
	});
	const forecastHistory = new HistoryManager<WeatherForecast[]>({
		onChange: (val) => (forecasts = val),
		transformer: {
			...anyTransformer(),
			deserialize: (string) => ensureArray(JSON.parse(string)).map((something) => new WeatherForecast(something))
		}
	});
	const syncer = new LocalStorageSyncer<string>("history", forecastHistory.serialize(), stringTransformer());
	forecastHistory.deserialize(syncer.pull());
	$: Promise.resolve(forecasts).then((res) => forecastHistory.addEntry(res));
	$: if (forecasts) syncer.push(forecastHistory.serialize());
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 3</h2>
<p>Server loaded data with refresh and history</p>

<button on:click={() => forecastData.invoke()}> Refresh </button>
<button on:click={() => forecastHistory.undo()}> undo </button>

<table>
	<thead>
		<tr>
			<th>Summary</th>
			<th>Date</th>
			<th>TemperatureC</th>
			<th>TemperatureF</th>
		</tr>
	</thead>
	<tbody>
		{#await forecasts}
			<tr>
				<td colspan="4">Loading...</td>
			</tr>
		{:then res}
			{#each res as forecast}
				<tr>
					<td><input type="text" bind:value={forecast.summary} /></td>
					<td>{forecast.date}</td>
					<td>{forecast.temperatureC}</td>
					<td>{forecast.temperatureF}</td>
				</tr>
			{/each}
		{:catch e}
			<tr>
				<td colspan="4" style="color:crimson">{e.message}</td>
			</tr>
		{/await}
	</tbody>
</table>
