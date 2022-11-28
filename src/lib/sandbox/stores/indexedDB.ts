import {writableIndexedDB} from "$lib/store/indexeddb/WritableIndexedDb";
import {RandomModel} from "../models/RandomModel";

export const indexedDB = writableIndexedDB<RandomModel>("testDb", "random_table", {
	initialValue: new RandomModel(),
	transform: (rawValue) => new RandomModel(JSON.parse(rawValue)),
	columns: ["date", "name", "num", "nully", "bool"]
});
