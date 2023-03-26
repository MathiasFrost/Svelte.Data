/** Represents an intentional 404 client side */
export class NotFoundError extends Error {
	/** */
	public constructor(message: string) {
		super(message);
		this.name = "NotFoundError";
	}
}
