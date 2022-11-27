import {writableSessionStorage} from "$lib/store/session/WritableSessionStorage";
import {RandomModel} from "../models/RandomModel";

export const session = writableSessionStorage<RandomModel>("random_model", {
	initialValue: new RandomModel(),
	transform: (rawValue) => new RandomModel(JSON.parse(rawValue))
});
