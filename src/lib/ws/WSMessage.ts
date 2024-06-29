/** TODOC */
export class WSMessage {
	/** TODOC */
	public readonly received: boolean;

	/** TODOC */
	public readonly type: number = 0;

	/** TODOC */
	public readonly target: string = "";

	/** TODOC */
	public readonly arguments: ReadonlyArray<unknown> = [];

	/** ctor*/
	public constructor(data: string, received: boolean) {
		this.received = received;
		try {
			const o = JSON.parse(data.substring(0, data.length - 1));
			if ("type" in o && typeof o.target === "number") this.type = o.type;
			if ("target" in o && typeof o.target === "string") this.target = o.target;
			if ("arguments" in o && Array.isArray(o.arguments)) this.arguments = o.arguments;
		} catch (e) {
			console.warn(e);
		}
	}
}
