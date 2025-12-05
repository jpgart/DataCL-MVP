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

interface ExporterYoYTrendProps {
	data: Array<{
		absolute_season_week: number;
		currentSeason: number;
		previousSeason: number;
	}>;
	currentSeason: string;
	previousSeason: string;
}

function decodeWeek(absoluteWeek: number): string {
	if (absoluteWeek <= 19) {
		const realWeek = 35 + (absoluteWeek - 1);
		return `Week ${realWeek}`;
	} else {
		const realWeek = absoluteWeek - 19;
		return `Week ${realWeek}`;
	}
}

export const ExporterYoYTrend = memo(function ExporterYoYTrend({
	data,
	currentSeason,
	previousSeason
}: ExporterYoYTrendProps) {
	const formatTooltip = (value: number | string, name?: string): [string, string] => {
		const numValue = typeof value === 'number' ? value : Number(value);
		return [`${formatChartNumber(numValue)} boxes`, name || 'Value'];
	};

	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
				<h2 className="text-xl font-bold text-gray-900 mb-4">
					Weekly Box Trend (YoY Comparison)
				</h2>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No trend data available for comparison
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
			<h2 className="text-xl font-bold text-gray-900 mb-4">
				Weekly Box Trend (YoY Comparison)
			</h2>
			<ResponsiveContainer width="100%" height={400}>
				<LineChart data={data}>
					<CartesianGrid 
						stroke={CHART_THEME.grid.stroke} 
						strokeDasharray={CHART_THEME.grid.strokeDasharray}
					/>
					<XAxis
						dataKey="absolute_season_week"
						tickFormatter={(value) => decodeWeek(value)}
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{ 
							value: 'Week', 
							position: 'insideBottom', 
							offset: -5,
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
						}}
					/>
					<YAxis
						tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
						label={{
							value: 'Boxes',
							angle: -90,
							position: 'insideLeft',
							style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize },
							width: 60
						}}
					/>
					<Tooltip
						content={<ChartTooltip formatter={formatTooltip} />}
						labelFormatter={(label) => `Week ${label} (${decodeWeek(Number(label))})`}
					/>
					<Legend
						verticalAlign="bottom"
						height={36}
						wrapperStyle={{ paddingTop: '20px' }}
						iconSize={12}
						fontSize={CHART_THEME.axis.fontSize}
						formatter={(value) => <span style={{ fontSize: `${CHART_THEME.axis.fontSize}px` }}>{value}</span>}
					/>
					<Line
						type="monotone"
						dataKey="currentSeason"
						stroke={getChartColor(0)}
						strokeWidth={2}
						name={currentSeason}
						dot={false}
						activeDot={{ r: 4 }}
					/>
					<Line
						type="monotone"
						dataKey="previousSeason"
						stroke={getChartColor(1)}
						strokeWidth={2}
						name={previousSeason}
						dot={false}
						activeDot={{ r: 4 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
});


