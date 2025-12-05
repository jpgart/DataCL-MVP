'use client';

import { memo } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer
} from 'recharts';
import { getChartColor, CHART_THEME } from '@/lib/chart-colors';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { formatChartNumber } from '@/lib/chart-utils';

interface ExporterProductsChartProps {
	data: Array<{ product: string; boxes: number }>;
}

export const ExporterProductsChart = memo(function ExporterProductsChart({ data }: ExporterProductsChartProps) {
	const formatTooltip = (value: number) => {
		return `${formatChartNumber(value)} boxes`;
	};

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Top Products Exported by Firm
				</h2>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No product data available
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-bold text-gray-900 mb-4">
				Top Products Exported by Firm
			</h2>
			<ResponsiveContainer width="100%" height={300}>
				<BarChart
					data={data}
					layout="vertical"
					margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
				>
					<CartesianGrid 
						stroke={CHART_THEME.grid.stroke} 
						strokeDasharray={CHART_THEME.grid.strokeDasharray}
					/>
					<XAxis 
						type="number" 
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{ 
							value: 'Boxes', 
							position: 'insideBottom', 
							offset: -5,
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
						}} 
					/>
					<YAxis
						type="category"
						dataKey="product"
						width={90}
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
					/>
					<Tooltip content={<ChartTooltip formatter={(v) => formatTooltip(v as number)} />} />
					<Bar dataKey="boxes" fill={getChartColor(0)} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
});


