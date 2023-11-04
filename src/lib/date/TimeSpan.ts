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

	/** The total seconds from all components */
	public get totalSeconds(): number {
		return this.days * 24 * 60 * 60 + this.hours * 60 * 60 + this.minutes * 60 + this.seconds + this.milliseconds / 1000 + this.microseconds / 1000 / 1000;
	}

	/** The total minutes from all components */
	public get totalMinutes(): number {
		return this.days * 24 * 60 + this.hours * 60 + this.minutes + this.seconds / 60 + this.milliseconds / 1000 / 60 + this.microseconds / 1000 / 1000 / 60;
	}

	/** The total hours from all components */
	public get totalHours(): number {
		return (
			this.days * 24 +
			this.hours +
			this.minutes / 60 +
			this.seconds / 60 / 60 +
			this.milliseconds / 1000 / 60 / 60 +
			this.microseconds / 1000 / 1000 / 60 / 60
		);
	}

	/** The total days from all components */
	public get totalDays(): number {
		return (
			this.days +
			this.hours / 24 +
			this.minutes / 60 / 24 +
			this.seconds / 60 / 60 / 24 +
			this.milliseconds / 1000 / 60 / 60 / 24 +
			this.microseconds / 1000 / 1000 / 60 / 60 / 24
		);
	}
}
