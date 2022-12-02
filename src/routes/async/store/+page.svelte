<script lang="ts">
	import ExampleComponent from "../../../sandbox/components/ExampleComponent.svelte";
	import {forecastData, forecasts} from "../../../sandbox/stores/asyncWritable";
</script>

<h1>Svelte.StoresPlus</h1>

<h2>local variable with async data</h2>

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
	<input type="text" bind:value={$forecasts[0].summary} />
	<button on:click={() => forecastData.refresh()}>refresh</button>
	<button on:click={() => forecastData.refresh(true)}>silent refresh</button>
{/if}

<hr />
<h2>Examplecomponent</h2>
<ExampleComponent />
