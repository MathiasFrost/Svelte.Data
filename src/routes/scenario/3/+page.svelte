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

	/** @inheritdoc */
	export let data: PageData;

	/** Example data */
	type WeatherForecastObject<T = WeatherForecast[]> = {
		value: T;
		promise: MaybePromise<T>;
		async: AsyncData<T>;
		history: HistoryManager<T>;
		historyStorage: LocalStorageSyncer<string>;
	};
	let forecasts = initForecasts();
	function initForecasts(): WeatherForecastObject {
		/** Wrapper for promise to enable easy refreshing */
		const async = new AsyncData({
			promiseFactory: () => TestClient.getForecasts(),
			cooldown: 2_000,
			onResolved: (res) => (forecasts.value = res),
			onReject: (e) => (forecasts.promise = Promise.reject(e))
		});

		/** Manage history for `forecasts` */
		const history = new HistoryManager<WeatherForecast[]>({
			onChange: (val) => (forecasts.value = val),
			transformer: {
				...anyTransformer(),
				deserialize: (string) => ensureArray(JSON.parse(string)).map((something) => new WeatherForecast(something))
			}
		});

		/** Store history in local storage */
		const localStorage = new LocalStorageSyncer<string>("history", history.serialize(), stringTransformer());

		return {
			// Deserialize stored history to history manager. If any, we use current entry instead of data from load.
			value: history.deserialize(localStorage.pull()) ?? data.forecasts,
			promise: [],
			async,
			history,
			historyStorage: localStorage
		};
	}

	// Add changes to `forecasts` to history
	$: Promise.resolve(forecasts.value).then((res) => {
		forecasts.history.addEntry(res);
		forecasts.historyStorage.push(forecasts.history.serialize());
	});
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 3</h2>
<p>Server loaded data with refresh and history</p>

<button on:click={() => forecasts.async.invoke()}> Refresh </button>
<button on:click={() => forecasts.history.undo()}> undo </button>
<button on:click={() => forecasts.history.redo()}> redo </button>
<button on:click={() => forecasts.historyStorage.clear()}> clear history </button>

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
		{#await forecasts.promise}
			<tr>
				<td colspan="4">Loading...</td>
			</tr>
		{:then}
			{#each forecasts.value as forecast}
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
