/** TODOC */
export class WSMessage {
	/** TODOC */
	public readonly type: number = 0;

	/** TODOC */
	public readonly target: string = "";

	/** TODOC */
	public readonly arguments: ReadonlyArray<unknown> = [];

	/** Current argument deserialized */
	public index = 0;

	/** ctor*/
	public constructor(data: string) {
		try {
			const o = JSON.parse(data.substring(0, data.length - 1));
			if ("type" in o && typeof o.target === "number") this.type = o.type;
			if ("target" in o && typeof o.target === "string") this.target = o.target;
			if ("arguments" in o && Array.isArray(o.arguments)) this.arguments = o.arguments;
		} catch (e) {
			console.warn(e);
		}
	}

	/** Deserialize argument and move to next */
	public deserialize<T>(deserializer: (something: unknown) => T, index?: number): T {
		if (typeof index === "number") return deserializer(this.arguments[index]);
		return deserializer(this.arguments[this.index++]);
	}
}
