<script lang="ts">
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
	import { onMount } from "svelte";
	import { ensureDictionary, ensureNumber, ensureString } from "$lib/types/unknown.js";

	/** TODOC */
	let forecasts: Promise<WeatherForecast[]> = Promise.resolve([]);
	$: console.log(forecasts);
	type TestType = "something" | "haha";
	const test = { key1: "test" };
	enum TestEnum {
		Haha,
		Mimi
	}
	onMount(async () => {
		forecasts = TestHTTP.getForecasts();
		// window.setTimeout(() => (forecasts.error = new Error("a")), 1000);

		// for (let i = 1; i < 6; i++) {
		// 	window.setTimeout(() => {
		// 		forecastsPromise.promise = TestHTTP.getForecasts();
		// 		forecasts.promise = TestHTTP.getForecasts();
		// 	}, 500 * i);
		// }
		const test4 = ensureNumber<TestEnum>(1);
		console.log(test4);

		const test3 = ensureString<TestType>("haha");
		console.log(test3);

		const test2 = ensureDictionary(test, ensureString);
		console.log(test2);

		window.addEventListener(
			"storage",
			(e) => {
				console.log(e);
			},
			false
		);
		window.addEventListener("focus", () => console.log("focused"));
		window.addEventListener("blur", () => console.log("inactive"));
	});
</script>

<h1>Svelte.Data</h1>

<h2>Welcome to your library project</h2>

<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<button on:click={() => window.localStorage.setItem("test", "hey")}> Test </button>

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
