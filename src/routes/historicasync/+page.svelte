<script lang="ts">
	import {historicAsync} from "../../sandbox/stores/historicAsync";
	import type {WeatherForecast} from "../../sandbox/models/WeatherForecast";
	import {onDestroy} from "svelte";

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
	<input type="text" bind:value={$historicAsync[0].summary} />
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
