/** */
export class DeepCopy<T> {
	public value: T;

	public constructor(value: T) {
		this.value = value;
	}

	public invoke(): void {
		if (Array.isArray(this.value)) {
			for (const field of this.value) {
				const keys = Object.keys(field);
				for (const key of keys) {
					const value = field[key];
					if (typeof value === "object" && value !== null) {
						field[key] = {...value};
					}
				}
			}
		} else if (typeof this.value === "object" && this.value !== null) {
			const keys = Object.keys(this.value);
			for (const key of keys) {
				const value = this.value[key];
				if (typeof value === "object" && value !== null) {
					this.value[key] = {...value};
				}
			}
		}
	}
}
