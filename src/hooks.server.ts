import crypto from "crypto";
import type { HandleServerError } from "@sveltejs/kit";

export const handleError = (async () => {
	const errorId = crypto.randomUUID();
	// example integration with https://sentry.io/
	console.log(errorId);
	return {
		message: "Whoops!",
		errorId
	};
}) satisfies HandleServerError;
