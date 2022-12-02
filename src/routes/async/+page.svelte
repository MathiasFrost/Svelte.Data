<script lang="ts">
	import {async} from "../../sandbox/stores/async";
</script>

<h1>Svelte.StoresPlus</h1>

<h2>local variable with async data</h2>

{#if typeof $async === "undefined"}
	<p>Loading...</p>
{:else if $async instanceof Error}
	<p style="color: crimson">{$async.message}</p>
	<p>{$async.stack}</p>
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
			{#each $async as forecast}
				<tr>
					<td>{forecast.date}</td>
					<td>{forecast.temperatureC}</td>
					<td>{forecast.temperatureF}</td>
					<td>{forecast.summary}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<input type="text" bind:value={$async[0].summary} />
	<button on:click={() => async.refresh()}>refresh</button>
	<button on:click={() => async.refresh(true)}>silent refresh</button>
{/if}
