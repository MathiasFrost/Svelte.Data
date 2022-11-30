import {writableCookie} from "$lib/cookie/WritableCookie";
import {RandomModel} from "../models/RandomModel";

export const cookie = writableCookie<RandomModel>("random_model", {
	initialValue: new RandomModel(),
	transform: (rawValue) => new RandomModel(JSON.parse(rawValue))
});
