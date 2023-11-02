/** Class holding values for ISO durations */
export class TimeSpan {
	/** TODOC */
	public readonly days: number = 0;

	/** TODOC */
	public readonly hours: number = 0;

	/** TODOC */
	public readonly minutes: number = 0;

	/** TODOC */
	public readonly seconds: number = 0;

	/** TODOC */
	public readonly milliseconds: number = 0;

	/** TODOC */
	public readonly microseconds: number = 0;

	/** TODOC */
	public constructor();
	public constructor(isoString: string);
	public constructor(days: number, hours: number, minutes: number, seconds: number, milliseconds: number, microseconds: number);
	public constructor(days?: number | string, hours?: number, minutes?: number, seconds?: number, milliseconds?: number, microseconds?: number) {
		if (typeof days === "string") {
			// [-]d.hh:mm:ss.ff
			const match = days.match(
				/^(?:(?<days>-?\d+)(?:\.|$))?(?:(?<hours>\d+)(?::|$))?(?:(?<minutes>\d+)(?::|$))?(?:(?<seconds>\d+)(?:\.|$))?(?<milliseconds>\d+)?$/
			);

			const groups: Record<string, string> = match?.groups ?? {};
			this.days = Number(groups.days) || 0;
			this.hours = Number(groups.hours) || 0;
			this.minutes = Number(groups.minutes) || 0;
			this.seconds = Number(groups.seconds) || 0;
			this.milliseconds = Number(groups.milliseconds) || 0;
			return;
		}
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
		const microseconds = this.milliseconds * 100_000 + this.microseconds * 10;
		if (microseconds) builder += `.${microseconds.toString().padStart(7, "0")}`;

		return builder;
	}

	/** The total milliseconds from all components */
	public get totalMilliseconds(): number {
		return (
			this.days * 24 * 60 * 60 * 1000 +
			this.hours * 60 * 60 * 1000 +
			this.minutes * 60 * 1000 +
			this.seconds * 1000 +
			this.milliseconds +
			this.microseconds / 1000
		);
	}
}
