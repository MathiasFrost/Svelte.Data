/** Wrapping rules for `DateOnly`
 * @see DateOnly */
export enum DateWrap {
	/** Apply both floor and ceil rules to the date.
	 * @see DateWrap.ceil
	 * @see DateWrap.floor */
	round,

	/** Of we run the CRON job at 0 UTC when a user from GMT +12 or more, they experience it as happening 12 or more hours too late.
	 * If we "floor" the date to the previous, they now experience it as happening 12 or fewer hours too early, which could be preferable for something like a notification CRON job.
	 * Users in GMT -12 or more would experience it as 12 or more hours too early, so here we do not do anything, hence the "floor" concept. */
	floor,

	/** If we run the CRON job at 0 UTC when a user from GMT -12 or less, they experience it as happening 12 or more hours too early.
	 * If we "ceil" the date to the next, they now experience it as happening 12 or fewer hours too late, which could be preferable for something like a deletion CRON job.
	 * Users in GMT +12 or more would experience it as 12 or more hours too late, so here we do not do anything, hence the "ceil" concept. */
	ceil
}

/** An extension of JS `Date` with only the year/month/date and still following the ISO standard */
export class DateOnly extends Date {
	/** @see DateWrap */
	private readonly wrap: DateWrap;

	/** New `DateOnly` with either an ISO string, year/month/date values, JS `Date` or nothing for today
	 * @param isoString ISO string representing a date. Time will be truncated if present.
	 * @param wrap How to wrap this date in extreme time-zones
	 * @param roundTripped Set to true when deserializing from an already wrapped date */
	public constructor(isoString: string, wrap: DateWrap, roundTripped?: boolean) {
		const date = new Date(isoString.substring(0, "yyyy-MM-dd".length));
		if (roundTripped) {
			switch (wrap) {
				case DateWrap.round:
					DateOnly.ceilDate(date, true);
					DateOnly.floorDate(date, true);
					break;
				case DateWrap.ceil:
					DateOnly.ceilDate(date, true);
					break;
				case DateWrap.floor:
					DateOnly.floorDate(date, true);
					break;
			}
		}
		super(date);
		this.wrap = wrap;
	}

	/** @returns DateOnly round-tripped */
	public static deserialize(isoString: string, wrap: DateWrap = DateWrap.floor): DateOnly {
		const date = new Date(isoString);
		switch (wrap) {
			case DateWrap.round:
				DateOnly.ceilDate(date, true);
				DateOnly.floorDate(date, true);
				break;
			case DateWrap.ceil:
				DateOnly.ceilDate(date, true);
				break;
			case DateWrap.floor:
				DateOnly.floorDate(date, true);
				break;
		}
		return new DateOnly(date.toISOString().substring(0, "yyyy-MM-dd".length), wrap);
	}

	/** @returns ISO string for today */
	public static today(): string {
		return new Date().toISOString().substring(0, "yyyy-MM-dd".length);
	}

	/** TODOC */
	public static offsetMinutes(date: Date = new Date()): number {
		return date.getTimezoneOffset() * -1;
	}

	/** TODOC */
	public static offsetString(date: Date = new Date()): string {
		const offset = date.getTimezoneOffset() * -1;
		const hours = Math.round(offset / 60);
		const minutes = Math.round(offset % 60);
		return "GMT+" + hours.toString().padStart(2, "0") + minutes.toString().padStart(2, "0");
	}

	/** If we run the CRON job at 0 UTC when a user from GMT -12 or less, they experience it as happening 12 or more hours too early.
	 * If we "ceil" the date to the next, they now experience it as happening 12 or fewer hours too late, which could be preferable for something like a deletion CRON job.
	 * Users in GMT +12 or more would experience it as 12 or more hours too late, so here we do not do anything, hence the "ceil" concept. */
	private static ceilDate(date: Date, reverse: boolean): void {
		const offsetCeilThreshold = -12 * 60;
		if (DateOnly.offsetMinutes(date) < offsetCeilThreshold) {
			if (reverse) date.setDate(date.getDate() - 1);
			else date.setDate(date.getDate() + 1);
		}
	}

	/** Of we run the CRON job at 0 UTC when a user from GMT +12 or more, they experience it as happening 12 or more hours too late.
	 * If we "floor" the date to the previous, they now experience it as happening 12 or fewer hours too early, which could be preferable for something like a notification CRON job.
	 * Users in GMT -12 or more would experience it as 12 or more hours too early, so here we do not do anything, hence the "floor" concept. */
	private static floorDate(date: Date, reverse: boolean): void {
		const offsetFloorThreshold = 12 * 60;
		if (DateOnly.offsetMinutes(date) > offsetFloorThreshold) {
			if (reverse) date.setDate(date.getDate() + 1);
			else date.setDate(date.getDate() - 1);
		}
	}

	/** @inheritDoc */
	public override toISOString(): string {
		switch (this.wrap) {
			case DateWrap.round:
				DateOnly.ceilDate(this, false);
				DateOnly.floorDate(this, false);
				break;
			case DateWrap.ceil:
				DateOnly.ceilDate(this, false);
				break;
			case DateWrap.floor:
				DateOnly.floorDate(this, false);
				break;
		}
		return super.toISOString().substring(0, "yyyy-MM-dd".length);
	}

	/** @inheritDoc */
	public override toJSON(): string {
		return this.toISOString();
	}

	/** @inheritDoc */
	public override toString(): string {
		const str = super.toString();
		const timeIndex = str.indexOf(":") - 3;
		const timeIndexEnd = str.lastIndexOf(":") + 3;
		return str.substring(0, timeIndex) + str.substring(timeIndexEnd);
	}
}
