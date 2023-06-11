<script lang="ts">
	import { DateKind, DateOnly } from "$lib/date/DateOnly.js";
	import { TimeSpan } from "$lib/date/TimeSpan.js";
	import { stripQuoutes } from "$lib/types/unknown.js";
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";

	let today = new DateOnly();

	/** The date from the perspective of the current culture */
	let date: string = new DateOnly().toLocaleISOString();

	/** The date after serialization */
	let roundTripped: string = new DateOnly().toISOString();

	let http = false;

	async function roundTrip(str: string): Promise<void> {
		date = str;
		if (http) {
			const trip = await TestHTTP.getDateOnly(new DateOnly(str, DateKind.local));
			roundTripped = stripQuoutes(trip);
		} else {
			roundTripped = new DateOnly(str, DateKind.local).toISOString();
		}
	}

	function addDays(date: DateOnly, days: number): DateOnly {
		const copy = new DateOnly(date);
		copy.setDate(copy.getDate() + days);
		return copy;
	}

	let timeSpan = new TimeSpan(0, 0, 1, 1, 1, 1);
</script>

<section>
	<h1>Date</h1>
	<input type="checkbox" bind:checked={http} />
	<input type="date" on:change={(e) => roundTrip(e.currentTarget.value)} />
	<pre style="font-family: 'JetBrains Mono', monospace">
Offset:                     {DateOnly.currentOffset()}
Now:                        {new Date()}
DateOnly now:               {new DateOnly()}
Normal Date:                {new Date(date)}

Raw:                        {date}
Date:                       {new DateOnly(date, DateKind.local)}
JS Date:                    {new DateOnly(date, DateKind.local).toDate()}
Day:                        {new DateOnly(date, DateKind.local).getDate()}
JSON:                       {new DateOnly(date, DateKind.local).toJSON()}
Value:                      {new DateOnly(date, DateKind.local).getTime()}

Round-trip Raw:             {roundTripped}
Round-trip Date:            {new DateOnly(roundTripped)}
Round-trip JS Date:         {new DateOnly(roundTripped).toDate()}
Round-trip Day:             {new DateOnly(roundTripped).getDate()}
Round-trip JSON:            {new DateOnly(roundTripped).toJSON()}
Value:                      {new DateOnly(roundTripped).getTime()}

Round-trip JS Date + 1:     {addDays(new DateOnly(roundTripped), 1).toDate()}
Round-trip JS Date + 1 day: {addDays(new DateOnly(roundTripped), 1).getDate()}
Round-trip === date:        {new DateOnly(roundTripped).getTime() === new DateOnly(date, DateKind.local).getTime()}

{new DateOnly(date, DateKind.local)} &lt;= {today}: {new DateOnly(date, DateKind.local) <= today}
	</pre>

	<h1>TimeSpan</h1>
	<input type="number" placeholder="days" />
	<p>TimeSpan: {timeSpan}</p>
</section>
