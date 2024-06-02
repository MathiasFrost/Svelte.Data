import { error, json, text } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";

const promise = () =>
	new Promise<void>((resolve) => {
		setTimeout(() => resolve(), 1_000);
	});

let user: { id: number; name: string; age: number } | null = { name: "Josephine", age: 22, id: 6 };

/** TODOC */
export const GET: RequestHandler = async ({ url }) => {
	await promise();
	const id = Number(url.searchParams.get("id")) || 0;
	if (id === 6) {
		if ((user?.id ?? 0) > 10) {
			user!.id = 6;
			throw error(500);
		}
		return json({ id: user ? ++user.id : 0, name: user?.name, age: user?.age ?? 0 });
	}
	throw error(404);
};

export const POST: RequestHandler = async ({ request }) => {
	await promise();
	const body = await request.formData();
	const name = body.get("name")?.toString() || "";
	const age = Number(body.get("age")) || 0;
	user = { id: 6, name, age };

	return text(user.id.toString());
};

export const PATCH: RequestHandler = async ({ url, request }) => {
	await promise();
	const body = await request.formData();
	const id = Number(url.searchParams.get("id")) || 0;
	const name = body.get("name")?.toString() || "";
	const age = Number(body.get("age")) || 0;
	if (id === user?.id) {
		user.name = name;
		user.age = age;
	}

	return text(id.toString());
};

export const DELETE: RequestHandler = async ({ url }) => {
	await promise();
	const id = Number(url.searchParams.get("id")) || 0;
	if (id === 6) {
		user = null;
	}

	return text("");
};
