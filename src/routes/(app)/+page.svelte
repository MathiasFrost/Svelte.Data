<script lang="ts">
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
	import { onMount } from "svelte";
	import { oidcManager, signInPrompt } from "$sandbox/user/oidcConfig.js";

	/** TODOC */
	let forecasts: Promise<WeatherForecast[]> = Promise.resolve([]);

	onMount(async () => {
		forecasts = TestHTTP.getForecasts();
	});

	let url: string | null = null;

	async function getProfile(): Promise<void> {
		const accessToken = await oidcManager.getAccessToken("MS.Graph");
		const res = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
			headers: {
				Authorization: "Bearer " + accessToken
			}
		});
		url = URL.createObjectURL(await res.blob());
	}
</script>

<h1>Svelte.Data</h1>

<h2>Welcome to your library project</h2>

<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<button on:click={() => getProfile()}> Get profile pic </button>

{#if $signInPrompt}
	<button
		on:click={() => {
			const prompt = $signInPrompt;
			if (prompt) oidcManager.signInUserInteraction(prompt);
		}}>Sing in to access {$signInPrompt}</button>
{/if}

{#if url}
	<img src={url} alt="xd" />
{/if}

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
				<td colspan="4" style="color:crimson"
					>{e.message}
					<pre>{e.stack}</pre></td>
			</tr>
		{/await}
	</tbody>
</table>
