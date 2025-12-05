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

interface TimeSeriesChartProps {
  data: Array<{
    absolute_season_week: number;
    [season: string]: number | string;
  }>;
}

// Function to decode absolute_season_week to "Real Week"
function decodeWeek(absoluteWeek: number): string {
  if (absoluteWeek <= 19) {
    // Weeks 35-53 of year 1
    const realWeek = 35 + (absoluteWeek - 1);
    return `Week ${realWeek}`;
  } else {
    // Weeks 1-34 of year 2
    const realWeek = absoluteWeek - 19;
    return `Week ${realWeek}`;
  }
}

export const TimeSeriesChart = memo(function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  // Obtener todas las temporadas únicas
  const seasons = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'absolute_season_week') {
        seasons.add(key);
      }
    });
  });

  const seasonArray = Array.from(seasons).sort();

  // Format data for tooltip
  const formatTooltip = (value: number | string, name?: string): [string, string] => {
    const numValue = typeof value === 'number' ? value : Number(value);
    return [`${formatChartNumber(numValue)} boxes`, name || 'Value'];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Weekly Export Volume Evolution
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
          {seasonArray.map((season, index) => (
            <Line
              key={season}
              type="monotone"
              dataKey={season}
              stroke={getChartColor(index)}
              strokeWidth={2}
              name={season}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});


