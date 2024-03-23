import { Deserializable, Type } from "$lib/http/Deserializable.js";

@Deserializable
export class User {
	@Type(Number)
	public readonly id: number = 0;

	@Type(String)
	public readonly name: string = "";

	@Type(Number)
	public readonly age: number = 0;
}
