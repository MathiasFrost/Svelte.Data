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

	/** @inheritDoc */
	public constructor(requestInit: RequestInit, response: Response, requestUri: string, content: string, e: Error) {
		super();
		this.response = response;
		this.requestInit = requestInit;
		this.message = `HTTP ${this.requestInit.method}: ${requestUri} was unsuccessful (${response.status} ${response.statusText})
body:
${HTTPResponseError.summary(JSON.stringify(this.requestInit.body))}
content:
${HTTPResponseError.summary(content)}
`;
		this.stack = e.stack;
		this.cause = e.cause;
		this.error = e;
	}

	/** TODOC */
	private static summary(str: string, maxLength = 1_000): string {
		if (str.length > maxLength) return str.substring(0, maxLength - 3) + "...";
		return str;
	}
}
