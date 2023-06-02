import { cloneViaSerialization } from "$lib/clone.js";
import fs from "fs";

/** */
enum JsonType {
	value,
	object,
	array
}

/** Load appsettings files, merge them and return a JsonObject */
export function loadAppsettings(): void {
	if (typeof process === "undefined") {
		console.warn("Tried to call loadAppsettings client-side");
		return;
	}

	/** Read file and return a JsonObject. If it doesn't exist return en empty JsonObject */
	const parseJsonFile = (filename: string) => {
		if (fs.existsSync(filename)) return JSON.parse(fs.readFileSync(filename, "utf-8"));
		else return {};
	};

	/** Find out which prop type the JsonNode is */
	const jsonType = (node: unknown) => {
		if (Array.isArray(node)) return JsonType.array;
		switch (typeof node) {
			case "number":
			case "string":
			case "boolean":
				return JsonType.value;
			case "object":
				return node === null ? JsonType.value : JsonType.object;
			default:
				throw new Error("JsonNode could not be cast to anything");
		}
	};

	/** Try to find the value of a key */
	const tryFind = (key: string, env: Record<string, unknown>) => (key in env ? env[key] : null);

	/** Check if JsonArray array contains a JsonNode */
	const exists = (arr: Record<string, unknown>[], node: Record<string, unknown>) => arr.some((x) => JSON.stringify(x) === JSON.stringify(node));

	/** Add array elements from a that does not exist in b */
	function mergeArray(a: Record<string, unknown>[], b: Record<string, unknown>[]) {
		for (const itemA of a) {
			const copyA = cloneViaSerialization(itemA);
			if (exists(b, copyA)) continue;
			b.push(copyA);
		}
	}

	/** Add the values from a that does not exist in b */
	function merge(a: Record<string, unknown>, b: Record<string, unknown>): void {
		for (const keyA of Object.keys(a)) {
			const propA = a[keyA];
			const propB = tryFind(keyA, b);
			switch (jsonType(propA)) {
				case JsonType.value:
					if (propB !== null) b[keyA] = cloneViaSerialization(propA);
					break;
				case JsonType.object:
					if (propB !== null) b[keyA] = cloneViaSerialization(propA);
					switch (jsonType(propB)) {
						case JsonType.value:
							break;
						case JsonType.object:
							merge(propA as Record<string, unknown>, propB as Record<string, unknown>);
							break;
						case JsonType.array:
							break;
						default:
							break;
					}
					break;
				case JsonType.array:
					if (propB !== null) b[keyA] = cloneViaSerialization(propA);
					switch (jsonType(propB)) {
						case JsonType.value:
							break;
						case JsonType.object:
							mergeArray(propA as Record<string, unknown>[], propB as Record<string, unknown>[]);
							break;
						case JsonType.array:
							break;
						default:
							break;
					}
					break;

				default:
					break;
			}
		}
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
				case JsonType.value:
					console.log(`${parent}__${key}: ${o[key]}`);
					process.env[`${parent}__${key}`] = `${o[key]}`;
					break;
				case JsonType.object:
					flatten(key, o[key] as Record<string, unknown>);
					break;
				case JsonType.array:
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
