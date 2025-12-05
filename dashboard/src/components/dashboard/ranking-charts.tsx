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
import { CHART_THEME, getChartColor } from '@/lib/chart-colors';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { formatChartNumber } from '@/lib/chart-utils';

interface RankingItem {
  name: string;
  boxes: number;
}

interface RankingChartsProps {
  topExporters: RankingItem[];
  topProducts: RankingItem[];
  uniqueSeasons?: string[];
  uniqueProducts?: string[];
  selectedSeason?: string;
  selectedProduct?: string;
  onSeasonFilter?: (season: string) => void;
  onProductFilter?: (product: string) => void;
}

export const RankingCharts = memo(function RankingCharts({ 
  topExporters, 
  topProducts,
  uniqueSeasons,
  uniqueProducts,
  selectedSeason,
  selectedProduct,
  onSeasonFilter,
  onProductFilter
}: RankingChartsProps) {
  const formatTooltip = (value: number | string): [string, string] => {
    const numValue = typeof value === 'number' ? value : Number(value);
    return [`${formatChartNumber(numValue)} boxes`, 'Boxes'];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Exportadores */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Top 5 Exporters
          </h2>
          {uniqueSeasons && uniqueSeasons.length > 0 && (
            <select
              value={selectedSeason || ''}
              onChange={(e) => onSeasonFilter?.(e.target.value)}
              className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All seasons</option>
              {uniqueSeasons.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topExporters}>
            <CartesianGrid 
              stroke={CHART_THEME.grid.stroke} 
              strokeDasharray={CHART_THEME.grid.strokeDasharray}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
            />
            <YAxis
              tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
              label={{ 
                value: 'Boxes', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
              }}
            />
            <Tooltip content={<ChartTooltip formatter={formatTooltip} />} />
            <Bar dataKey="boxes" fill={getChartColor(0)} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Productos */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Top 5 Products
          </h2>
          {uniqueProducts && uniqueProducts.length > 0 && (
            <select
              value={selectedProduct || ''}
              onChange={(e) => onProductFilter?.(e.target.value)}
              className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All products</option>
              {uniqueProducts.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProducts}>
            <CartesianGrid 
              stroke={CHART_THEME.grid.stroke} 
              strokeDasharray={CHART_THEME.grid.strokeDasharray}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
            />
            <YAxis
              tick={{ fill: CHART_THEME.axis.tickColor, fontSize: CHART_THEME.axis.fontSize }}
              label={{ 
                value: 'Boxes', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: CHART_THEME.axis.labelColor, fontSize: CHART_THEME.axis.fontSize }
              }}
            />
            <Tooltip content={<ChartTooltip formatter={formatTooltip} />} />
            <Bar dataKey="boxes" fill={getChartColor(1)} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});


