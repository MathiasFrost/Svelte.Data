<script lang="ts">
	import {promise} from "$lib/sandbox/stores/promise";

	function handleChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		promise.update(async (prev) => {
			const val = await prev;
			val[0].summary = target.value;
			console.log(val);
			return val;
		});
	}
</script>

<h1>Svelte.StoresPlus</h1>

<h2>WritablePromise</h2>

{#await $promise}
	{@debug $promise}
	<p>Loading...</p>
{:then forecasts}
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
			{#each forecasts as forecast}
				<tr>
					<td>{forecast.date}</td>
					<td>{forecast.temperatureC}</td>
					<td>{forecast.temperatureF}</td>
					<td>{forecast.summary}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<input type="text" value={forecasts[0].summary} on:input={handleChange} />
	<button on:click={() => promise.reset()}>refresh</button>
	<button on:click={() => promise.reset(true)}>silent refresh</button>
{:catch e}
	<p style="color: crimson">{e.message}</p>
	<p>{e.stack}</p>
{/await}
