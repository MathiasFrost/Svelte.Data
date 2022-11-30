import {writableLocalStorage} from "$lib/local/WritableLocalStorage";
import {RandomModel} from "../models/RandomModel";

export const local = writableLocalStorage<RandomModel>("random_model", {
	initialValue: new RandomModel(),
	transform: (rawValue) => new RandomModel(JSON.parse(rawValue))
});