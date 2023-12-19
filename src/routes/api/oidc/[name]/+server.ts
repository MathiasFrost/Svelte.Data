import { text } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";

/** TODOC */
export const GET: RequestHandler = async ({ cookies, params }) => {
	return text(cookies.get(params.name) ?? "");
};

/** TODOC */
export const PUT: RequestHandler = async ({ cookies, params, request }) => {
	cookies.set(params.name, await request.text(), { path: "/" });
	return new Response();
};
