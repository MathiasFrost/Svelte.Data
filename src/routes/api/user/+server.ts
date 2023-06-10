import { error, json, text } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { get } from "svelte/store";
import { unauthorized } from "$sandbox/user/unauthorized.js";

const promise = () =>
	new Promise<void>((resolve) => {
		setTimeout(() => resolve(), 1_000);
	});

/** */
export const GET: RequestHandler = async () => {
	await promise();
	if (get(unauthorized)) throw error(401);
	return json({ name: "Me" });
};

export const POST: RequestHandler = async () => {
	unauthorized.set(false);
	return text("");
};
