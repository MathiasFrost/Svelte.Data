/** Class holding values for ISO durations */
export class TimeSpan {
	/** */
	public readonly days: number;

	/** */
	public readonly hours: number;

	/** */
	public readonly minutes: number;

	/** */
	public readonly seconds: number;

	/** */
	public readonly milliseconds: number;

	/** */
	public readonly microseconds: number;

	/** */
	public constructor();
	public constructor(days: number, hours: number, minutes: number, seconds: number, milliseconds: number, microseconds: number);
	public constructor(days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number, microseconds?: number) {
		this.days = days ?? 0;
		this.hours = hours ?? 0;
		this.minutes = minutes ?? 0;
		this.seconds = seconds ?? 0;
		this.milliseconds = milliseconds ?? 0;
		this.microseconds = microseconds ?? 0;
	}

	/** @inheritdoc */
	public toString(): string {
		let builder = this.days ? `${this.days.toString()}.` : "";
		builder += `${this.hours.toString().padStart(2, "0")}.${this.minutes.toString().padStart(2, "0")}.${this.seconds.toString().padStart(2, "0")}`;
		const microseconds = this.milliseconds * 10_000 + this.microseconds * 10;
		if (microseconds) builder += `.${microseconds.toString().padStart(7, "0")}`;

		return builder;
	}
}
