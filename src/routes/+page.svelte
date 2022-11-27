<script lang="ts">
	import {forecasts} from "$lib/sandbox/stores";
	import type {WeatherForecast} from "$lib/sandbox/WeatherForecast";
	import type {AsyncState} from "$lib/store/async/AsyncState";
	import {onDestroy} from "svelte";

	function updateSummary(e: any): void {
		forecasts.update((prev) => {
			if (typeof prev === "object") {
				(<WeatherForecast[]>prev)[0].summary = e.target.value;
			}
			return prev;
		});
	}

	let history: AsyncState<WeatherForecast[]>[] = [];
	let index: number = 0;

	let unsubscribeHistory = forecasts.history.subscribe((value) => (history = value));
	let unsubscribeIndex = forecasts.index.subscribe((value) => (index = value));

	onDestroy(() => {
		unsubscribeHistory();
		unsubscribeIndex();
	});
</script>

<h1>Svelte.StoresPlus</h1>

<h2>Welcome to your library project</h2>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

{#if typeof $forecasts === "undefined"}
	<p>Loading...</p>
{:else if $forecasts instanceof Error}
	<p style="color: crimson">{$forecasts.message}</p>
	<p>{$forecasts.stack}</p>
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
			{#each $forecasts as forecast}
				<tr>
					<td>{forecast.date}</td>
					<td>{forecast.temperatureC}</td>
					<td>{forecast.temperatureF}</td>
					<td>{forecast.summary}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<input type="text" value={$forecasts[0].summary} on:change={updateSummary} />
	<button on:click={forecasts.undo}>undo</button>
	<button on:click={forecasts.redo}>redo</button>
	<button on:click={() => forecasts.refresh()}>refresh</button>
	<button on:click={forecasts.deleteHistory}>clear</button>
	<p>Index: {index}</p>
	<ul>
		{#each history as item, i}
			<li style={i === index ? "color: crimson;" : ""}>{Array.isArray(item) && item[0].summary}</li>
		{/each}
	</ul>
{/if}
