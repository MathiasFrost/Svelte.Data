import { error } from "@sveltejs/kit";
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
	throw error(400, { message: "test", errorId: "123" });
};
