import { cloneViaSerialization } from "$lib/clone.js";
import fs from "fs";

/** */
type JsonType = "null" | "value" | "object" | "array";

/** Read file and return a JsonObject. If it doesn't exist return en empty JsonObject */
const parseJsonFile = (filename: string) => {
	if (fs.existsSync(filename)) {
		try {
			return JSON.parse(fs.readFileSync(filename, "utf-8"));
		} catch (e) {
			console.error(`Unable to parse ${filename}`);
			throw e;
		}
	} else {
		return {};
	}
};

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

/** TODOC */
function isValue(node: unknown): node is number | string | boolean | bigint {
	return jsonType(node) === "value";
}

/** TODOC */
function isObject(node: unknown): node is Record<string, unknown> {
	return jsonType(node) === "object";
}

/** TODOC */
function isArray(node: unknown): node is Record<string, unknown>[] {
	return jsonType(node) === "array";
}

/// Layer b on top of a
function merge(a: unknown, b: unknown): void {
	if (isObject(a) && isObject(b)) {
		for (const keyB of Object.keys(b)) {
			const valA = a[keyB];
			const valB = b[keyB];

			if (typeof valA !== "undefined") {
				if (isValue(valA)) a[keyB] = cloneViaSerialization(valB); // If a is value, replace a with b
				else if (isObject(valA) && isObject(valB)) merge(valA, valB); // If both are objects merge them recursively
				else if (isArray(valA) && isArray(valB)) merge(valA, valB); // If both are objects merge them recursively
				else if (isObject(valB)) a[keyB] = cloneViaSerialization(valB); // If types are different, just overwrite
				else if (isArray(valB)) a[keyB] = cloneViaSerialization(valB); // If types are different, just overwrite
				else if (isValue(valB)) a[keyB] = cloneViaSerialization(valB); // If types are different, just overwrite
			} else {
				// If a does not have b, simply add b to a
				a[keyB] = cloneViaSerialization(valB);
			}
		}
	} else if (isArray(a) && isArray(b)) {
		let i = 0;
		for (const elB of b) {
			if (a.length > i) {
				const elA = a[i];

				if (isValue(elA)) a[i] = cloneViaSerialization(elB); // If a is value, replace a with b
				else if (isObject(elA) && isObject(elB)) merge(elA, elB); // If both are objects merge them recursively
				else if (isArray(elA) && isArray(elB)) merge(elA, elB); // If both are objects merge them recursively
				else if (isObject(elB)) a[i] = cloneViaSerialization(elB); // If types are different, just overwrite
				else if (isArray(elB)) a[i] = cloneViaSerialization(elB); // If types are different, just overwrite
				else if (isValue(elB)) a[i] = cloneViaSerialization(elB); // If types are different, just overwrite
			} else {
				// If a does not have b, simply add b to a
				a.push(cloneViaSerialization(elB));
			}
			i++;
		}
	}
}

/** Load appsettings files, merge them and return a JsonObject */
export function loadAppsettings(): void {
	if (typeof process === "undefined") {
		console.warn("Tried to call loadAppsettings client-side");
		return;
	}

	const svelteKitEnv =
		process.env["SVELTEKIT_ENVIRONMENT"] ?? (process.argv[process.argv.length - 2] === "--" ? process.argv[process.argv.length - 1] : null);

	const rootJson = parseJsonFile("appsettings.json");
	const envJson = typeof svelteKitEnv === "string" ? parseJsonFile(`appsettings.${svelteKitEnv}.json`) : {};
	const localRootJson = parseJsonFile("appsettings.local.json");
	const localEnvJson = typeof svelteKitEnv === "string" ? parseJsonFile(`appsettings.${svelteKitEnv}.local.json`) : {};

	merge(rootJson, envJson);
	merge(rootJson, localRootJson);
	merge(rootJson, localEnvJson);

	function flatten(parent: string, o: Record<string, unknown>): void {
		for (const key of Object.keys(o)) {
			switch (jsonType(o[key])) {
				case "value":
					process.env[`${parent}${key}`] = `${o[key]}`;
					break;
				case "object":
					flatten(key + "__", o[key] as Record<string, unknown>);
					break;
				case "array":
					for (let i = 0; i < (o[key] as Record<string, unknown>[]).length; i++) {
						const el = (o[key] as Record<string, unknown>[])[i];
						flatten(`${key}__0`, el);
					}
					break;
				default:
					break;
			}
		}
	}

	flatten("", rootJson);
}
