import {writableCookies} from "$lib/store/cookies/WritableCookies";
import {RandomModel} from "../models/RandomModel";

export const cookies = writableCookies<RandomModel>("random_model", {
	initialValue: new RandomModel(),
	transform: (rawValue) => new RandomModel(JSON.parse(rawValue))
});
