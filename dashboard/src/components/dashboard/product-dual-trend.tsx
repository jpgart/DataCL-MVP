'use client';

import { memo } from 'react';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer
} from 'recharts';
import { getChartColor, CHART_THEME } from '@/lib/chart-colors';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { formatChartNumber } from '@/lib/chart-utils';

interface ProductDualTrendProps {
	data: Array<{ year: number; boxes: number; avgPricePerKg: number }>;
}

export const ProductDualTrend = memo(function ProductDualTrend({ data }: ProductDualTrendProps) {
	const formatTooltip = (value: number | string, name?: string): [string, string] => {
		const numValue = typeof value === 'number' ? value : Number(value);
		if (name === 'boxes') {
			return [`${formatChartNumber(numValue)} boxes`, 'Boxes'];
		}
		if (name === 'avgPricePerKg') {
			return [`$${numValue.toFixed(2)}/kg`, 'Average Price'];
		}
		return [String(numValue), name || 'Value'];
	};

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Annual Trend of Boxes vs. Average Price
				</h2>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No trend data available
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-bold text-gray-900 mb-4">
				Annual Trend of Boxes vs. Average Price
			</h2>
			<ResponsiveContainer width="100%" height={400}>
				<LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
					<CartesianGrid 
						stroke={CHART_THEME.grid.stroke} 
						strokeDasharray={CHART_THEME.grid.strokeDasharray}
					/>
					<XAxis
						dataKey="year"
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{ 
							value: 'Year', 
							position: 'insideBottom', 
							offset: -5,
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
						}}
					/>
					<YAxis
						yAxisId="left"
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{
							value: 'Boxes',
							angle: -90,
							position: 'insideLeft',
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize },
							width: 60
						}}
					/>
					<YAxis
						yAxisId="right"
						orientation="right"
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{
							value: 'Price ($/kg)',
							angle: 90,
							position: 'insideRight',
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize },
							width: 80
						}}
					/>
					<Tooltip content={<ChartTooltip formatter={formatTooltip} />} />
					<Legend
						verticalAlign="top"
						height={36}
						fontSize={CHART_THEME.axis.fontSize}
						formatter={(value) => <span style={{ fontSize: `${CHART_THEME.axis.fontSize}px` }}>{value}</span>}
					/>
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="boxes"
						stroke={getChartColor(0)}
						strokeWidth={2}
						name="Boxes"
						dot={false}
						activeDot={{ r: 4 }}
					/>
					<Line
						yAxisId="right"
						type="monotone"
						dataKey="avgPricePerKg"
						stroke={getChartColor(1)}
						strokeWidth={2}
						name="Average Price"
						dot={false}
						activeDot={{ r: 4 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
});


