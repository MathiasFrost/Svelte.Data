import { ensureBoolean, ensureDateString, ensureNumber, ensureObject, ensureString } from "$lib";

export class RandomModel {
	public date: Date = new Date();
	public name = "";
	public num = 0;
	public nully: string | null = null;
	public bool = false;

	public constructor(something?: unknown) {
		if (typeof something === "undefined") {
			return;
		}
		const o = ensureObject(something);
		this.date = ensureDateString(o.date);
		this.name = ensureString(o.name);
		this.num = ensureNumber(o.num);
		this.nully = o.nully === null ? o.nully : ensureString(o.nully);
		this.bool = ensureBoolean(o.bool);
	}
}
