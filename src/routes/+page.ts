/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const res = await fetch("http://localhost:5000/Basic/Ip");
	const str = await res.text();

	return { str };
}
