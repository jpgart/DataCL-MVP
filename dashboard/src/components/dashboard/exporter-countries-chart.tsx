'use client';

import { memo } from 'react';
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend
} from 'recharts';
import { getChartColor, CHART_THEME } from '@/lib/chart-colors';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { formatChartNumber } from '@/lib/chart-utils';

interface ExporterCountriesChartProps {
	data: Array<{ country: string; boxes: number; percentage: number }>;
}

export const ExporterCountriesChart = memo(function ExporterCountriesChart({ data }: ExporterCountriesChartProps) {
	const formatTooltip = (value: number | string, name?: string, props?: { payload?: { percentage?: number } }): [string, string] => {
		const numValue = typeof value === 'number' ? value : Number(value);
		const percentage = (props?.payload?.percentage as number) || 0;
		return [`${formatChartNumber(numValue)} boxes (${percentage.toFixed(2)}%)`, name || 'Value'];
	};

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Distribution by Destination Country
				</h2>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No country data available
				</div>
			</div>
		);
	}

	// Prepare data for PieChart (only show top countries if too many)
	const displayData = data.slice(0, 10).map(item => ({
		name: item.country,
		value: item.boxes,
		percentage: item.percentage
	}));

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-bold text-gray-900 mb-4">
				Distribution by Destination Country
			</h2>
			<ResponsiveContainer width="100%" height={300}>
				<PieChart>
					<Pie
						data={displayData}
						cx="50%"
						cy="50%"
						labelLine={false}
						label={(props) => {
							const entry = props as { name?: string; percentage?: number };
							return `${entry.name || ''}: ${(entry.percentage || 0).toFixed(1)}%`;
						}}
						outerRadius={100}
						innerRadius={60}
						fill={getChartColor(0)}
						dataKey="value"
					>
						{displayData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={getChartColor(index)} />
						))}
					</Pie>
					<Tooltip content={<ChartTooltip formatter={formatTooltip} />} />
					<Legend
						verticalAlign="bottom"
						height={36}
						fontSize={CHART_THEME.axis.fontSize}
						formatter={(value) => <span style={{ fontSize: `${CHART_THEME.axis.fontSize}px` }}>{value}</span>}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
});

