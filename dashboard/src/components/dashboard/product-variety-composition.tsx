'use client';

import { memo, useMemo } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Cell
} from 'recharts';
import { getChartColor, CHART_THEME } from '@/lib/chart-colors';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { formatChartNumber, aggregateSmallCategories } from '@/lib/chart-utils';

interface ProductVarietyCompositionProps {
	data: Array<{ season: string; variety: string; boxes: number; percentage: number }>;
}

export const ProductVarietyComposition = memo(function ProductVarietyComposition({ data }: ProductVarietyCompositionProps) {
	const formatTooltip = (value: number | string, name?: string, props?: { payload?: { percentage?: number } }): [string, string] => {
		const numValue = typeof value === 'number' ? value : Number(value);
		const percentage = props?.payload?.percentage || 0;
		return [`${formatChartNumber(numValue)} boxes (${percentage.toFixed(1)}%)`, name || 'Value'];
	};

	// Group data by season and variety - MOVED BEFORE EARLY RETURN
	const seasons = useMemo(() => {
		if (!data || data.length === 0) return [];
		return Array.from(new Set(data.map(d => d.season))).sort();
	}, [data]);
	
	// Aggregate varieties to show top 8 + Others - MOVED BEFORE EARLY RETURN
	const varietyTotals = useMemo(() => {
		if (!data || data.length === 0) return [];
		const totals = new Map<string, number>();
		data.forEach(d => {
			totals.set(d.variety, (totals.get(d.variety) || 0) + d.boxes);
		});
		return Array.from(totals.entries()).map(([variety, boxes]) => ({ variety, boxes, value: boxes }));
	}, [data]);

	const aggregatedVarieties = useMemo(() => {
		if (varietyTotals.length === 0) return [];
		const aggregated = aggregateSmallCategories(varietyTotals, 8);
		return aggregated.map(item => {
			// Type guard to ensure variety exists
			if ('variety' in item) {
				return item.variety as string;
			}
			return 'Others';
		});
	}, [varietyTotals]);

	// Prepare chart data - each season is a bar, stacked by variety
	const chartData = useMemo(() => {
		if (seasons.length === 0 || aggregatedVarieties.length === 0) return [];
		return seasons.map(season => {
			const seasonData: { season: string; [variety: string]: number | string } = { season };
			
			aggregatedVarieties.forEach(variety => {
				const item = data.find(d => d.season === season && d.variety === variety);
				seasonData[variety] = item ? item.percentage : 0; // Use percentage for 100% stacked
			});

			return seasonData;
		});
	}, [seasons, aggregatedVarieties, data]);

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Variety Composition by Season
				</h2>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No variety data available for this product
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-bold text-gray-900 mb-4">
				Variety Composition by Season
			</h2>
			<ResponsiveContainer width="100%" height={400}>
				<BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
					<CartesianGrid 
						stroke={CHART_THEME.grid.stroke} 
						strokeDasharray={CHART_THEME.grid.strokeDasharray}
					/>
					<XAxis
						dataKey="season"
						angle={-45}
						textAnchor="end"
						height={100}
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
					/>
					<YAxis
						domain={[0, 100]}
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{ 
							value: 'Percentage (%)', 
							angle: -90, 
							position: 'insideLeft',
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
						}}
					/>
					<Tooltip content={<ChartTooltip formatter={formatTooltip} />} />
					<Legend
						verticalAlign="top"
						height={36}
						wrapperStyle={{ paddingBottom: '10px' }}
						fontSize={CHART_THEME.axis.fontSize}
						formatter={(value) => <span style={{ fontSize: `${CHART_THEME.axis.fontSize}px` }}>{value}</span>}
					/>
					{aggregatedVarieties.map((variety, index) => (
						<Bar
							key={variety}
							dataKey={variety}
							stackId="variety"
							fill={getChartColor(index)}
							name={variety === 'Unknown' ? 'No variety specified' : variety}
						>
							{chartData.map((entry, entryIndex) => (
								<Cell
									key={`cell-${variety}-${entryIndex}`}
									fill={getChartColor(index)}
								/>
							))}
						</Bar>
					))}
				</BarChart>
			</ResponsiveContainer>
			<div className="mt-4 text-sm text-gray-600">
				<p>Shows how the variety mix has changed across the last {seasons.length} season(s). Each bar represents 100% of boxes for that season.</p>
			</div>
		</div>
	);
});


