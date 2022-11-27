import {historicWritable} from "$lib/store/shared/HistoricWritable";

/** @internal */
export const historic = historicWritable<string>("initial value");
