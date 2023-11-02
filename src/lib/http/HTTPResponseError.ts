/** TODOC */
export class HTTPResponseError extends Error {
	/** @inheritDoc */
	public override name: string = "HTTPResponseError";

	/** @inheritDoc */
	public override stack: string | undefined;

	/** @inheritDoc */
	public override cause: unknown | undefined;

	/** @inheritDoc */
	public override message: string;

	/** @see Error */
	public readonly error: Error;

	/** @see Response */
	public readonly response: Response;

	/** @see RequestInit */
	public readonly requestInit: RequestInit;

	/** HTTP Request URI */
	public readonly requestUri: string;

	/** @inheritDoc */
	public constructor(requestInit: RequestInit, response: Response, requestUri: string, e: Error) {
		super();
		this.response = response;
		this.requestInit = requestInit;
		this.requestUri = requestUri;
		this.message = `${this.requestInit.method}: ${this.requestUri} was unsuccessful (${this.response.status} ${this.response.statusText})`;
		this.stack = e.stack;
		this.cause = e.cause;
		this.error = e;
	}

	/** TODOC */
	public async requestSummary(): Promise<string> {
		const body = typeof this.requestInit.body === "undefined" ? "" : JSON.stringify(this.requestInit.body);
		const content = await this.response.text();
		return `${this.requestInit.method}: ${this.requestUri} was unsuccessful (${this.response.status} ${this.response.statusText})
body:
${HTTPResponseError.summary(body)}
content:
${HTTPResponseError.summary(content)}
`;
	}

	/** TODOC */
	private static summary(str: string, maxLength = 1_000): string {
		if (str.length > maxLength) return str.substring(0, maxLength - 3) + "...";
		return str;
	}
}
