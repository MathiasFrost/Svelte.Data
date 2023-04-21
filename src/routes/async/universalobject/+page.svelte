<script lang="ts">
	import { TestClient } from "$sandbox/http/TestClient";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
	import type { PageData } from "./$types";
	import { browser } from "$app/environment";
	import { AsyncBuilder, type AsyncObject } from "$lib/async/AsyncData";

	function testPromise(forecast: string): Promise<string> {
		return new Promise<string>((resolve) =>
			window.setTimeout(() => {
				resolve(forecast.toUpperCase());
			}, 600)
		);
	}

	/** */
	export let data: PageData;

	const forecasts: AsyncObject<WeatherForecast[]> = new AsyncBuilder<WeatherForecast[]>()
		.fromPromise(() => TestClient.getForecasts())
		.withInitialValue(data.forecasts)
		.withSetter((value) => (forecasts.value = value))
		.asObject();

	const second: AsyncObject<string> = new AsyncBuilder<string>()
		.withInitialValue("")
		.withSetter((value) => (second.value = value))
		.asObject();
	function setSecond(forecasts: WeatherForecast[]): void {
		if (browser) second.setAndInvoke(() => testPromise(forecasts[0]?.summary ?? ""));
	}
	$: Promise.resolve(forecasts.value).then(setSecond);
</script>

<h1>Svelte.Data</h1>

<h2>Async object from universal load</h2>

<button on:click={forecasts.refresh}> Refresh </button>
<button on:click={forecasts.silentRefresh}> Silent Refresh </button>

<table>
	<thead>
		<tr>
			<th>Date</th>
			<th>C</th>
			<th>Summary</th>
			<th>Promise</th>
		</tr>
	</thead>
	<tbody>
		{#await forecasts.value}
			<tr>
				<td colspan="4">Loading...</td>
			</tr>
		{:then forecasts}
			{#each forecasts as forecast}
				<tr>
					<td>{forecast.date.toISOString()}</td>
					<td>{forecast.temperatureC}</td>
					<td><input type="text" bind:value={forecast.summary} /></td>
					<td>
						{#await second.value}
							Loading...
						{:then text}
							{text}
						{/await}
					</td>
				</tr>
			{/each}
		{:catch e}
			<tr>
				<td colspan="4">{e.message}</td>
			</tr>
		{/await}
	</tbody>
</table>
