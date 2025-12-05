/**
 * Chart utilities for data aggregation, normalization, and formatting
 */

/**
 * Aggregate small categories into "Others" bucket
 * Maintains total integrity while reducing visual clutter
 */
export function aggregateSmallCategories<T extends { value: number }>(
	data: T[],
	limit: number = 8
): Array<T & { isAggregated?: boolean }> {
	if (data.length <= limit) {
		return data;
	}

	// Sort by value descending
	const sorted = [...data].sort((a, b) => b.value - a.value);

	// Take top N
	const topN = sorted.slice(0, limit);

	// Aggregate the rest
	const others = sorted.slice(limit);
	const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

	// Create "Others" entry (preserve structure of T)
	if (othersTotal > 0 && others.length > 0) {
		const othersEntry = {
			...others[0], // Preserve other properties from first item
			value: othersTotal,
			isAggregated: true
		} as T & { isAggregated: boolean };

		// If the original data has a name/label property, set it to "Others"
		if ('name' in othersEntry) {
			(othersEntry as Record<string, unknown>).name = 'Others';
		}
		if ('label' in othersEntry) {
			(othersEntry as Record<string, unknown>).label = 'Others';
		}
		if ('product' in othersEntry) {
			(othersEntry as Record<string, unknown>).product = 'Others';
		}
		if ('variety' in othersEntry) {
			(othersEntry as Record<string, unknown>).variety = 'Others';
		}
		if ('country' in othersEntry) {
			(othersEntry as Record<string, unknown>).country = 'Others';
		}
		if ('exporter' in othersEntry) {
			(othersEntry as Record<string, unknown>).exporter = 'Others';
		}

		return [...topN, othersEntry];
	}

	return topN;
}

/**
 * Normalize series data for consistent chart rendering
 * - Ensures sorted order
 * - Handles null/undefined values
 * - Validates data structure
 */
export function normalizeSeriesData<T extends Record<string, unknown>>(
	data: T[],
	sortKey?: keyof T,
	sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
	if (!data || data.length === 0) {
		return [];
	}

	const normalized = [...data];

	// Sort if sortKey provided
	if (sortKey) {
		normalized.sort((a, b) => {
			const aVal = a[sortKey];
			const bVal = b[sortKey];
			
			if (aVal == null) return 1;
			if (bVal == null) return -1;
			
			const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			return sortOrder === 'asc' ? comparison : -comparison;
		});
	}

	// Replace null/undefined with 0 for numeric values (optional, can be customized)
	// For now, we'll keep nulls as they are for chart libraries to handle

	return normalized;
}

/**
 * Format number for display in charts
 * Uses Intl.NumberFormat for consistent formatting
 */
export function formatChartNumber(
	value: number,
	options: {
		style?: 'decimal' | 'currency' | 'percent';
		minimumFractionDigits?: number;
		maximumFractionDigits?: number;
		notation?: 'standard' | 'compact';
	} = {}
): string {
	const {
		style = 'decimal',
		minimumFractionDigits = 0,
		maximumFractionDigits = 2,
		notation = 'standard'
	} = options;

	return new Intl.NumberFormat('en-US', {
		style,
		minimumFractionDigits,
		maximumFractionDigits,
		notation
	}).format(value);
}

/**
 * Calculate percentage for stacked charts
 */
export function calculatePercentage(value: number, total: number): number {
	if (total === 0) return 0;
	return (value / total) * 100;
}

