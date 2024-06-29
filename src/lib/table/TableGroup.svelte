<script lang="ts" generics="T">
	export let groups: Record<string, keyof T>;
	export let data: T[];

	interface IGrouping<T> {
		key: string;
		value: unknown;
		level: number;
		count: number;
		data: T[];
	}

	function groupData<T>(data: T[], groups: Record<string, keyof T>): IGrouping<T>[] {
		const result: IGrouping<T>[] = [];
		const groupKeys = Object.keys(groups);

		function recursiveGroup(currentData: T[], currentLevel: number): void {
			if (currentLevel >= groupKeys.length) return;

			const groupKey = groupKeys[currentLevel];
			const selector = groups[groupKey];
			const grouped = new Map<unknown, T[]>();

			for (const item of currentData) {
				const key = item[selector];
				if (!grouped.has(key)) {
					grouped.set(key, []);
				}
				grouped.get(key)!.push(item);
			}

			for (const [groupValue, items] of grouped.entries()) {
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
