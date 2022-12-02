<script lang="ts">
	import {stateIsResolved} from "$lib/async/AsyncState";
	import {forecasts, forecastData} from "../stores/asyncWritable";
</script>

{#if stateIsResolved($forecasts)}
	<input type="text" bind:value={$forecasts[0].summary} />
	<button on:click={() => forecastData.refresh()}>refresh</button>
	<button on:click={() => forecastData.refresh(true)}>silent refresh</button>
{/if}
