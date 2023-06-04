import fs from "fs";

/** */
type JsonType = "null" | "value" | "object" | "array";

/** Find out which prop type the JsonNode is */
const jsonType = (node: unknown): JsonType => {
	switch (typeof node) {
		case "number":
		case "string":
		case "boolean":
		case "bigint":
			return "value";
		case "object":
			if (node === null) return "null";
			if (Array.isArray(node)) return "array";
			return "object";
		default:
			throw new Error("JsonNode could not be cast to anything");
	}
};

/** Add flat JSON key/value pairs from JSON object */
function flatten(parent: string, o: Record<string, unknown>): void {
	for (const key of Object.keys(o)) {
		switch (jsonType(o[key])) {
			case "value":
				process.env[`${parent}${key}`] = `${o[key]}`;
				break;
			case "object":
				flatten(`${key}_`, o[key] as Record<string, unknown>);
				break;
			case "array":
				for (let i = 0; i < (o[key] as Record<string, unknown>[]).length; i++) {
					const el = (o[key] as Record<string, unknown>[])[i];
					flatten(`${key}_0`, el);
				}
				break;
			default:
				break;
		}
	}
}

/** Read file and return a JsonObject. If it doesn't exist return en empty JsonObject */
const addJsonFile = (filename: string): void => {
	if (fs.existsSync(filename)) {
		try {
			const json = JSON.parse(fs.readFileSync(filename, "utf-8"));
			flatten("", json);
		} catch (e) {
			console.error(`Unable to parse ${filename}`);
			throw e;
		}
	}
};

/** Load appsettings files, merge them and return a JsonObject */
export function loadAppsettings(): void {
	if (typeof process === "undefined") {
		console.warn("Tried to call loadAppsettings client-side");
		return;
	}

	const svelteKitEnv =
		process.env["SVELTEKIT_ENVIRONMENT"] ?? (process.argv[process.argv.length - 2] === "--" ? process.argv[process.argv.length - 1] : null);

	addJsonFile("appsettings.json");
	if (typeof svelteKitEnv === "string") addJsonFile(`appsettings.${svelteKitEnv}.json`);
	addJsonFile("appsettings.secrets.json");
}
