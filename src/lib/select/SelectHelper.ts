/** @static */
export class SelectHelper {
	/** @returns The Levenshtein distance between two strings */
	public static levenshteinDistance(a: string, b: string): number {
		const matrix: number[][] = [];

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) == a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
				}
			}
		}

		return matrix[b.length][a.length];
	}

	public static defaultFilter<T>(items: T[], inputs: Record<string, string>): T[] {
		return items.filter((item) => {
			return (
				Object.keys(inputs).reduce((prev, curr) => {
					if (!inputs[curr]) return 0;
					return prev + SelectHelper.levenshteinDistance(inputs[curr], JSON.stringify(item));
				}, 0) < 25
			);
		});
	}

	/** @returns Array of elements satisfying the Levenshtein threshold */
	public static filter<T>(pool: T[], search: string, threshold = 2, selector?: (item: T) => string): T[] {
		selector ??= (item) => `${item}`;
		return pool.filter((item) => this.levenshteinDistance(selector!(item), search) > threshold);
	}
}
