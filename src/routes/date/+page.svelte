<script lang="ts">
	import { DateKind, DateOnly } from "$lib/date/DateOnly.js";
	import { TimeSpan } from "$lib/date/TimeSpan.js";
	import { stripQuoutes } from "$lib/types/unknown.js";
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";

	let today = new DateOnly();

	let date: string = new DateOnly().toISOString();

	let roundTripped: string = new DateOnly(date).toISOString();

	async function roundTrip(str: string): Promise<void> {
		date = str;
		const trip = await TestHTTP.getDateOnly(new DateOnly(str, DateKind.currentCulture));
		roundTripped = stripQuoutes(trip);
	}

	let timeSpan = new TimeSpan(0, 0, 1, 1, 1, 1);
</script>

<section>
	<h1>Date</h1>
	<input type="date" on:change={(e) => roundTrip(e.currentTarget.value)} />
	<pre style="font-family: 'JetBrains Mono', monospace">
Offset:                     {DateOnly.currentOffset()}
Normal Date:                {new Date(date)}

Raw:                        {date}
Date:                       {new DateOnly(date, DateKind.currentCulture)}
JS Date:                    {new DateOnly(date, DateKind.currentCulture).toDate()}
Day:                        {new DateOnly(date, DateKind.currentCulture).getDate()}
JSON:                       {new DateOnly(date, DateKind.currentCulture).toJSON()}

Round-trip Raw:             {roundTripped}
Round-trip Date:            {new DateOnly(roundTripped)}
Round-trip JS Date:         {new DateOnly(roundTripped).toDate()}
Round-trip Day:             {new DateOnly(roundTripped).getDate()}
Round-trip JSON:            {new DateOnly(roundTripped).toJSON()}
<!-- Round-trip JS Date + 1 day: {roundTripped.addDays(1).jsDate} -->
<!-- Round-trip JS Date + 1 day: {roundTripped.addDays(1).date} -->
<!-- Round-trip === date:        {roundTripped.getTime() === new DateOnly(date).getTime()} -->
{new DateOnly(date)} &lt; {today}: {new DateOnly(date) < today}
	</pre>

	<h1>TimeSpan</h1>
	<input type="number" placeholder="days" />
	<p>TimeSpan: {timeSpan}</p>
</section>
