import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";

/** */
const summaries = [null, "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"];

/** */
function getRandomArbitrary(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

/** */
function getRandomInt(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const promise = () =>
	new Promise<void>((resolve) => {
		setTimeout(() => resolve(), 1_000);
	});

/** */
export const GET: RequestHandler = async () => {
	console.log("get");
	await promise();
	return json(
		Array.from({ length: 10 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const temperatureC = getRandomArbitrary(-20, 55);
			return {
				date,
				temperatureC,
				temperatureF: 32 + temperatureC / 0.5556,
				summary: summaries[getRandomInt(0, summaries.length - 1)]
			};
		})
	);
};
