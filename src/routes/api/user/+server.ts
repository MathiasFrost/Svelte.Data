import { error, json, text } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { unauthorized } from "$sandbox/user/unauthorized.js";

const promise = () =>
	new Promise<void>((resolve) => {
		setTimeout(() => resolve(), 1_000);
	});

/** TODOC */
export const GET: RequestHandler = async ({ request }) => {
	await promise();
	const parts = request.headers.get("Authorization")?.split(" ");
	if (!parts?.[1].startsWith("ey")) throw error(401);
	return json({ name: "Me" });
};

export const POST: RequestHandler = async () => {
	unauthorized.set(false);
	return text("");
};
