/** Parsing rules
 * @see DateOnly.parse */
export enum DateKind {
	/** Date is assumed to denote UTC */
	universal,

	/** Date should be adjusted for current culture's time zone offset */
	currentCulture
}

/** An extension of JS `Date` with only the year/month/date parts following the ISO standard */
export class DateOnly extends Date {
	/** New `DateOnly` with either an ISO string, year/month/date values, JS `Date` or nothing for today */
	public constructor();
	public constructor(year: number, month: number, date: number);
	public constructor(jsDate: Date);
	public constructor(isoString: string, kind?: DateKind);
	public constructor(arg0?: string | Date | number, arg1?: number | DateKind, date?: number) {
		let year: number;
		let hoursOffset = 0;
		let minutesOffset = 0;
		if (arg0 instanceof Date) {
			year = arg0.getFullYear();
			arg1 = arg0.getMonth();
			date = arg0.getDate();
		} else if (typeof arg0 === "number") {
			year = arg0;
			arg1 = arg1 ?? 0;
			date = date ?? 1;
		} else if (typeof arg0 === "string") {
			const kind: DateKind = arg1 ?? DateKind.universal;

			const parts = arg0.split("-");
			year = Number(parts[0]);
			arg1 = Number(parts[1]) - 1;
			date = Number(parts[2]);

			switch (kind) {
				case DateKind.currentCulture:
					// 2023-06-13 in GMT+3 is 3 hours ahead of an ISO 2023-06-13
					// Add the offset when constructing from a culture's perspective
					// [hoursOffset, minutesOffset] = DateOnly.currentOffset();
					break;
				case DateKind.universal:
					{
						// 2023-06-13 in GMT+2 is 2 hours ahead of a UTC 2023-06-13
						// Add the hours that was lost when deserializing (when subtracting the offset and truncating the time part)
						const [_hoursOffset, _minutesOffset] = DateOnly.currentOffset();

						const a = new Date(year, arg1, date, 0, 0, 0);
						a.setHours(a.getHours() - _hoursOffset);
						a.setMinutes(a.getMinutes() - _minutesOffset);
						a.setHours(0);
						a.setMinutes(0);
						console.log(a);

						const b = new Date(year, arg1, date, 0, 0, 0);
						console.log(b);

						const hoursTruncated = (b.getTime() - a.getTime()) / 1_000 / 60;
						const hours = Math.round(hoursTruncated / 60);
						const minutes = Math.round(hoursTruncated % 60);
						console.log("Diff: " + hoursTruncated + " " + hours + ":" + minutes);

						hoursOffset = hours;
						minutesOffset = minutes;
						console.log("Res: " + new Date(year, arg1, date, hoursOffset, minutesOffset));
					}
					break;
				default:
					throw new Error("Out of range");
			}
		} else {
			const now = new Date();
			year = now.getFullYear();
			arg1 = now.getMonth();
			date = now.getDate();
		}

		super(year, arg1, date, hoursOffset, minutesOffset, 0, 0);
	}

	/** @returns [Hours, Minutes] */
	public static currentOffset(): [number, number] {
		const offset = new Date().getTimezoneOffset() * -1;

		const hours = Math.round(offset / 60);
		const minutes = Math.round(offset % 60);
		return [hours, minutes];
	}

	/** @returns The regular JS `Date` */
	public toDate(): Date {
		return new Date(this);
	}

	/** @inheritdoc */
	public override toString(): string {
		return super.toDateString();
	}

	/** @inheritdoc */
	public override toJSON(): string {
		return this.toISOString();
	}

	/** @inheritdoc */
	public override toISOString(): string {
		const [hoursOffset, minutesOffset] = DateOnly.currentOffset();

		// 2023-06-13 in GMT+2 is 2 hours ahead of a UTC 2023-06-13
		// Subtract the offset when serializing to convert to UTC
		// SOFTTODO: Round to nearest day to give more intuative values for the culture's perspective
		const copy = new Date(this);
		copy.setHours(copy.getHours() - hoursOffset);
		copy.setMinutes(copy.getMinutes() - minutesOffset);

		return copy.toISOString()?.substring(0, 10) ?? null;
	}
}
