import { error, text } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { unauthorized } from "$sandbox/user/unauthorized.js";
import { get } from "svelte/store";

const promise = () =>
	new Promise<void>((resolve) => {
		setTimeout(() => resolve(), 1_000);
	});

/** */
export const GET: RequestHandler = async () => {
	await promise();
	if (!get(unauthorized)) {
		unauthorized.set(true);
		return text("Hello there");
	}
	throw error(401);
};
