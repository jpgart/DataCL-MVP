'use client';

import { memo } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Cell,
	ResponsiveContainer
} from 'recharts';
import { getChartColor, CHART_THEME } from '@/lib/chart-colors';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { formatChartNumber } from '@/lib/chart-utils';

interface ProductExportersChartProps {
	data: Array<{ exporter: string; kilos: number; percentage: number }>;
}

export const ProductExportersChart = memo(function ProductExportersChart({ data }: ProductExportersChartProps) {
	const formatTooltip = (value: number | string, name?: string): [string, string] => {
		const numValue = typeof value === 'number' ? value : Number(value);
		if (name === 'percentage') {
			return [`${numValue.toFixed(2)}%`, 'Participation'];
		}
		return [`${formatChartNumber(numValue)} kg`, name || 'Value'];
	};

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Top 10 Exporters of the Product
				</h2>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No exporter data available
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-bold text-gray-900 mb-4">
				Top 10 Exporters of the Product
			</h2>
			<ResponsiveContainer width="100%" height={400}>
				<BarChart
					data={data}
					layout="vertical"
					margin={{ top: 5, right: 80, left: 120, bottom: 5 }}
				>
					<CartesianGrid 
						stroke={CHART_THEME.grid.stroke} 
						strokeDasharray={CHART_THEME.grid.strokeDasharray}
					/>
					<XAxis
						type="number"
						domain={[0, 100]}
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{ 
							value: 'Participation %', 
							position: 'insideBottom', 
							offset: -5,
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
						}}
					/>
					<YAxis
						type="category"
						dataKey="exporter"
						width={110}
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
					/>
					<Tooltip content={<ChartTooltip formatter={formatTooltip} />} />
					<Bar dataKey="percentage" fill={getChartColor(0)}>
						{data.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={getChartColor(0)} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
			<div className="mt-2 text-sm text-gray-600 text-center">
				Showing participation percentage by volume (kilograms)
			</div>
		</div>
	);
});


