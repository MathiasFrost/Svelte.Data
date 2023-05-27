<script lang="ts">
	import { AsyncData } from "$lib/async/AsyncData.js";
	import { HistoryManager } from "$lib/history/HistoryManager.js";
	import { LocalStorageSyncer } from "$lib/sync/LocalStorageSyncer.js";
	import { jsonTransformer, stringTransformer } from "$lib/types/transformers.js";
	import { ensureArray } from "$lib/types/unknown.js";
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";
	import { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
	import type { MaybePromise } from "@sveltejs/kit";
	import type { PageData } from "./$types.js";

	/** @inheritdoc */
	export let data: PageData;

	/** Manage history for `forecasts` */
	const history = new HistoryManager<WeatherForecast[]>({
		onChange: (val) => (forecasts = val),
		transformer: jsonTransformer((string) => ensureArray(JSON.parse(string)).map((something) => new WeatherForecast(something)))
	});
	/** Store history in local storage */
	const local = new LocalStorageSyncer<string>("history", history.serialize(), stringTransformer());

	let forecasts: WeatherForecast[] = history.deserialize(local.pull()) ?? data.forecasts;
	let forecastPromise: MaybePromise<WeatherForecast[]> = forecasts;

	/** Wrapper for promise to enable easy refreshing */
	const async = new AsyncData<WeatherForecast[]>({
		promiseFactory: () => TestHTTP.getForecasts(),
		cooldown: 2_000,
		onInvoked: (promise) => (forecastPromise = promise),
		onResolved: (res) => (forecasts = res)
	});

	// Add changes to `forecasts` to history
	$: {
		history.addEntry(forecasts);
		local.push(history.serialize());
	}
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 3</h2>
<p>Server loaded data with refresh and history</p>

<button on:click={() => async.invoke()}> Refresh</button>
<button on:click={() => history.undo()}> undo</button>
<button on:click={() => history.redo()}> redo</button>
<button on:click={() => local.clear()}> clear history</button>

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
		{#await forecastPromise}
			<tr>
				<td colspan="4">Loading...</td>
			</tr>
		{:then}
			{#each forecasts as forecast}
				<tr>
					<td><input type="text" bind:value={forecast.summary} /></td>
					<td>{forecast.date.toLocaleString()}</td>
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
