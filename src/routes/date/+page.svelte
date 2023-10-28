<script lang="ts">
	import { DateOnly, DateWrap } from "$lib/date/DateOnly.js";
	import { testHttp } from "$sandbox/http/TestHTTP.js";
	import { TimeSpan } from "$lib/date";
	import { history } from "$lib/history/history.js";

	/** Initial value - Today */
	let str = DateOnly.today();

	/** If we round-trip via HTTP */
	let http = false;

	/** How we wrap */
	const wrap = DateWrap.ceil;

	async function roundTrip(http: boolean, dateOnly: DateOnly): Promise<DateOnly> {
		if (http) {
			return await testHttp.getDateOnly(dateOnly, wrap);
		} else {
			return new DateOnly(dateOnly.toJSON(), wrap, true);
		}
	}

	function submit(this: HTMLFormElement): void {
		console.log(new FormData(this));
	}
</script>

<section use:history>
	<h1>Date</h1>
	<input type="checkbox" bind:checked={http} />
	<form on:submit|preventDefault={submit}>
		<input type="date" name="date" bind:value={str} />
		<button type="submit">submit</button>
	</form>
	{new TimeSpan("5.8:32:16")}
	<pre style="font-family: 'JetBrains Mono', monospace">
Offset:                     {DateOnly.offsetMinutes()} ({DateOnly.offsetString()})
Now:                        {new Date()}

Normal Date:                {new Date(str)}
Normal Date JSON:           {new Date(str).toJSON()}

DateOnly:                   {new DateOnly(str, wrap)}
DateOnly JSON:              {new DateOnly(str, wrap).toJSON()}
</pre>

	{#await roundTrip(http, new DateOnly(str, wrap))}
		<pre style="font-family: 'JetBrains Mono', monospace">
Round-trip:                 Loading...
Round-trip JSON:            Loading...
			</pre>
	{:then res}
		<pre style="font-family: 'JetBrains Mono', monospace">
Round-trip:                 {res}
Round-trip JSON:            {res.toISOString()}
			</pre>
	{/await}
</section>
