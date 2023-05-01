import type { HandleClientError } from "@sveltejs/kit";

console.log("test");
export const handleError = (async () => {
	const errorId = crypto.randomUUID();
	// example integration with https://sentry.io/
	await fetch("http://localhost:5000/WeatherForecast/Test?query=test");
	console.log(errorId);
	return {
		message: "Whoops!",
		errorId
	};
}) satisfies HandleClientError;
