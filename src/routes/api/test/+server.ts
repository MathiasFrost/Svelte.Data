import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";

const promise = () =>
	new Promise<void>((resolve) => {
		setTimeout(() => resolve(), 1_000);
	});

/** TODOC */
export const GET: RequestHandler = async () => {
	await promise();
	// if (!get(unauthorized)) {
	// 	unauthorized.set(true);
	// 	return text("Hello there");
	// }
	return json({ name: "asd", age: 2 });
};
