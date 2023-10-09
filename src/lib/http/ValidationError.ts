/** The result of a Response.prototype.validationErrors() exception */
export class ValidationError extends Error {
	/** All validation errors returned from response */
	public errors: Record<string, string[]>;

	public get firstError(): string {
		const keys = Object.keys(this.errors);
		if (keys.length) {
			const errors = this.errors[keys[0]];
			if (errors.length) return errors[0];
		}
		return "An unspecified validation error occurred.";
	}

	/** TODOC */
	public constructor(errors: Record<string, string[]>) {
		super("One or more validation errors occurred.");
		this.name = "ValidationError";
		this.errors = errors;
	}
}
