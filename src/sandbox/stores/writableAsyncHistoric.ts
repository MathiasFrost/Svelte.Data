import {AsyncData, stateIsResolved, HistoryManager} from "$lib";
import {writable, type Readable, type Updater, type Writable} from "svelte/store";
import type {WeatherForecast} from "$sandbox/models/WeatherForecast";
import {testClient} from "$sandbox/services/testClient";

const {set: _set, update: _update, subscribe} = writable<undefined | WeatherForecast[] | Error>(void 0);

const index = writable<number>(-1);
const history = writable<WeatherForecast[][]>([]);

const manager = new HistoryManager<WeatherForecast[]>({
	cap: 10,
	setValue: (value) => _set(value),
	setIndex: (i) => index.set(i),
	setHistory: (value) => history.set(value),
	ensureT(value): value is WeatherForecast[] {
		return !(value instanceof Error) && typeof value !== "undefined";
	}
});

function set(value: WeatherForecast[]): void {
	_set(value);
	manager.addEntry(value);
}

function update(updater: Updater<WeatherForecast[]>): void {
	_update((prev) => {
		if (stateIsResolved(prev)) {
			const val = updater(prev);
			manager.addEntry(val);
			return val;
		}
		return prev;
	});
}

const data = new AsyncData<WeatherForecast[]>(() => testClient.getForecasts(), {
	browserOnly: true,
	setValue: (value) => {
		_set(value);
		manager.addEntry(value);
	}
});

export const forecasts: Writable<undefined | WeatherForecast[] | Error> & {refresh: (silent?: boolean) => void; redo: () => void; undo: () => void} = {
	set,
	update,
	subscribe,
	refresh: data.refresh.bind(data),
	redo: manager.redo.bind(manager),
	undo: manager.undo.bind(manager)
};
export const forecastIndex: Readable<number> = {subscribe: index.subscribe};
export const forecastHistory: Readable<WeatherForecast[][]> = {subscribe: history.subscribe};
