/**
 * Centralized color system for all charts
 * Based on D3 Category10 and Tableau10 palettes, refined for accessibility
 */

// Categorical palette (12 colors) - optimized for charts
export const CHART_COLORS = [
	'#3b82f6', // blue-500
	'#10b981', // emerald-500
	'#f59e0b', // amber-500
	'#ef4444', // red-500
	'#8b5cf6', // violet-500
	'#ec4899', // pink-500
	'#06b6d4', // cyan-500
	'#84cc16', // lime-500
	'#f97316', // orange-500
	'#6366f1', // indigo-500
	'#14b8a6', // teal-500
	'#a855f7'  // purple-500
] as const;

// Semantic color mappings
export const SEMANTIC_COLORS = {
	positive: '#10b981', // emerald-500 (green)
	negative: '#ef4444', // red-500
	neutral: '#3b82f6',  // blue-500
	warning: '#f59e0b',  // amber-500
	info: '#06b6d4'      // cyan-500
} as const;

// Chart-specific color assignments
export const CHART_THEME = {
	// Line chart colors
	line: {
		primary: CHART_COLORS[0],
		secondary: CHART_COLORS[1],
		tertiary: CHART_COLORS[2],
		accent: CHART_COLORS[3]
	},
	// Bar chart colors
	bar: {
		primary: CHART_COLORS[0],
		secondary: CHART_COLORS[1],
		highlight: CHART_COLORS[3]
	},
	// Pie/Donut chart colors
	pie: CHART_COLORS,
	// Grid and axis colors
	grid: {
		stroke: '#e5e7eb', // gray-200
		strokeDasharray: '3 3'
	},
	axis: {
		tickColor: '#6b7280', // gray-500
		labelColor: '#374151', // gray-700
		fontSize: 13
	}
} as const;

/**
 * Get a color from the palette by index
 * Wraps around for large category lists
 */
export function getChartColor(index: number): string {
	return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Get semantic color by tone
 */
export function getSemanticColor(tone: 'positive' | 'negative' | 'neutral' | 'warning' | 'info'): string {
	return SEMANTIC_COLORS[tone];
}

/**
 * Get multiple colors for a series
 */
export function getChartColors(count: number): string[] {
	return Array.from({ length: count }, (_, i) => getChartColor(i));
}

