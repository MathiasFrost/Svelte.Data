<script lang="ts" generics="T">
	// eslint-disable-next-line no-undef
	export let groups: Record<string, keyof T>;
	// eslint-disable-next-line no-undef
	export let data: T[];

	// eslint-disable-next-line no-undef
	interface IGrouping<T> {
		key: string;
		value: unknown;
		level: number;
		count: number;
		data: T[];
	}

	// eslint-disable-next-line no-undef
	function groupData<T>(data: T[], groups: Record<string, keyof T>): IGrouping<T>[] {
		// eslint-disable-next-line no-undef
		const result: IGrouping<T>[] = [];
		const groupKeys = Object.keys(groups);

		// eslint-disable-next-line no-undef
		function recursiveGroup(currentData: T[], currentLevel: number): void {
			if (currentLevel >= groupKeys.length) return;

			const groupKey = groupKeys[currentLevel];
			const selector = groups[groupKey];
			// eslint-disable-next-line no-undef
			const grouped = new Map<unknown, T[]>();

			for (const item of currentData) {
				const key = item[selector];
				if (!grouped.has(key)) {
					grouped.set(key, []);
				}
				grouped.get(key)!.push(item);
			}

			for (const [groupValue, items] of grouped.entries()) {
				// eslint-disable-next-line no-undef
				const grouping: IGrouping<T> = {
					key: groupKey,
					value: groupValue,
					level: currentLevel,
					count: items.length,
					data: items
				};

				result.push(grouping);
				recursiveGroup(items, currentLevel + 1);
			}
		}

		recursiveGroup(data, 0);
		return result;
	}
</script>

<slot grouped={groupData(data, groups)} />
