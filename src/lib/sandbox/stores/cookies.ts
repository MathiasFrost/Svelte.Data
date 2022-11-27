import { writableCookies } from "$lib/store/cookies/WritableCookies";
import type { RandomModel } from "../models/RandomModel";

export const cookies = writableCookies<RandomModel>()