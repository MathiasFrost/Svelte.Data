<script lang="ts">
	import {historicAsync} from "$lib/sandbox/stores/historicAsync";
	import type {WeatherForecast} from "$lib/sandbox/models/WeatherForecast";
	import {stateIsResolved} from "$lib/store/async/AsyncState";
	import {onDestroy} from "svelte";

	function updateSummary(e: Event): void {
		historicAsync.update((prev) => {
			if (stateIsResolved(prev) && prev.length) {
				const target = e.target as HTMLInputElement;
				prev[0].summary = target.value;
			}
			return prev;
		});
	}

	let history: WeatherForecast[][] = [];
	let index = 0;

	let unsubscribeHistory = historicAsync.history.subscribe((value) => (history = value));
	let unsubscribeIndex = historicAsync.index.subscribe((value) => (index = value));

	onDestroy(() => {
		unsubscribeHistory();
		unsubscribeIndex();
	});
</script>

<h1>Svelte.StoresPlus</h1>

<h2>HistoricWritableAsync</h2>

{#if typeof $historicAsync === "undefined"}
	<p>Loading...</p>
{:else if $historicAsync instanceof Error}
	<p style="color: crimson">{$historicAsync.message}</p>
	<p>{$historicAsync.stack}</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>Date</th>
				<th>TemperatureC</th>
				<th>TemperatureF</th>
				<th>Summary</th>
			</tr>
		</thead>
		<tbody>
			{#each $historicAsync as forecast}
				<tr>
					<td>{forecast.date}</td>
					<td>{forecast.temperatureC}</td>
					<td>{forecast.temperatureF}</td>
					<td>{forecast.summary}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<input type="text" value={$historicAsync[0].summary} on:change={updateSummary} />
	<button on:click={historicAsync.undo}>undo</button>
	<button on:click={historicAsync.redo}>redo</button>
	<button on:click={() => historicAsync.refresh()}>refresh</button>
	<button on:click={() => historicAsync.refresh(true)}>silent refresh</button>
	<button on:click={historicAsync.deleteHistory}>clear</button>
	<p>Index: {index}</p>
	<ul>
		{#each history as item, i}
			<li style={i === index ? "color: crimson;" : ""}>{Array.isArray(item) && item[0].summary}</li>
		{/each}
	</ul>
{/if}
