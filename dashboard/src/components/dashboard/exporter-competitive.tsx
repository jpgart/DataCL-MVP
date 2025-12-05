'use client';

import { memo } from 'react';
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
import { getChartColor, getSemanticColor, CHART_THEME } from '@/lib/chart-colors';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { formatChartNumber } from '@/lib/chart-utils';

interface ExporterCompetitiveProps {
	data: Array<{ exporter: string; boxes: number; yoyChangePercent: number }>;
	selectedExporter: string;
}

export const ExporterCompetitive = memo(function ExporterCompetitive({ data, selectedExporter }: ExporterCompetitiveProps) {
	const formatTooltip = (value: number | string, name?: string): [string, string] => {
		const numValue = typeof value === 'number' ? value : Number(value);
		if (name === 'Boxes') {
			return [`${formatChartNumber(numValue)} boxes`, name];
		}
		return [`${numValue.toFixed(2)}%`, name || 'Value'];
	};

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Positioning vs Top 5 Competitors (Last Month)
				</h2>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No competitive data available
				</div>
			</div>
		);
	}

	// Prepare data for grouped bar chart
	const chartData = data.map(item => ({
		exporter: item.exporter.length > 20 ? item.exporter.substring(0, 20) + '...' : item.exporter,
		fullExporter: item.exporter,
		boxes: item.boxes,
		yoyChange: item.yoyChangePercent
	}));

	// Highlight selected exporter
	const getBarColor = (exporter: string) => {
		return exporter === selectedExporter || chartData.find(d => d.fullExporter === exporter)?.fullExporter === selectedExporter
			? getSemanticColor('negative')
			: getChartColor(0);
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-bold text-gray-900 mb-4">
				Positioning vs Top 5 Competitors (Last Month)
			</h2>
			<ResponsiveContainer width="100%" height={400}>
				<BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
					<CartesianGrid 
						stroke={CHART_THEME.grid.stroke} 
						strokeDasharray={CHART_THEME.grid.strokeDasharray}
					/>
					<XAxis
						dataKey="exporter"
						angle={-45}
						textAnchor="end"
						height={100}
						interval={0}
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
					/>
					<YAxis
						yAxisId="left"
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{ 
							value: 'Boxes', 
							angle: -90, 
							position: 'insideLeft',
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
						}}
					/>
					<YAxis
						yAxisId="right"
						orientation="right"
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{ 
							value: 'YoY Change %', 
							angle: 90, 
							position: 'insideRight',
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
						}}
					/>
					<Tooltip content={<ChartTooltip formatter={formatTooltip} />} />
					<Legend
						verticalAlign="top"
						height={36}
						fontSize={CHART_THEME.axis.fontSize}
						formatter={(value) => <span style={{ fontSize: `${CHART_THEME.axis.fontSize}px` }}>{value}</span>}
					/>
					<Bar yAxisId="left" dataKey="boxes" name="Boxes" fill={getChartColor(0)}>
						{chartData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={getBarColor(entry.fullExporter)} />
						))}
					</Bar>
					<Bar yAxisId="right" dataKey="yoyChange" name="YoY Change %" fill={getChartColor(1)} />
				</BarChart>
			</ResponsiveContainer>
			<div className="mt-4 text-sm text-gray-600">
				<span className="inline-block w-4 h-4 rounded mr-2" style={{ backgroundColor: getSemanticColor('negative') }}></span>
				Selected exporter highlighted in red
			</div>
		</div>
	);
});


