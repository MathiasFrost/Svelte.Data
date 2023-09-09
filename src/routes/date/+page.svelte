<script lang="ts">
	import { DateOnly, DateWrap } from "$lib/date/DateOnly.js";
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";

	/** Initial value - Today */
	let str = DateOnly.today();

	/** If we round-trip via HTTP */
	let http = false;

	/** How we wrap */
	const wrap = DateWrap.ceil;

	async function roundTrip(http: boolean, dateOnly: DateOnly): Promise<DateOnly> {
		if (http) {
			return await TestHTTP.getDateOnly(dateOnly, wrap);
		} else {
			return new DateOnly(dateOnly.toJSON(), wrap, true);
		}
	}
</script>

<section>
	<h1>Date</h1>
	<input type="checkbox" bind:checked={http} />
	<input type="date" bind:value={str} />
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
