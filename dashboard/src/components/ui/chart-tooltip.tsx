'use client';

import { formatChartNumber } from '@/lib/chart-utils';
import { cn } from '@/lib/utils';

interface ChartTooltipProps {
	active?: boolean;
	payload?: Array<{
		name?: string;
		value?: number | string;
		dataKey?: string;
		color?: string;
		payload?: Record<string, unknown>;
	}>;
	label?: string | number;
	labelFormatter?: (label: string | number) => string;
	formatter?: (value: number | string, name?: string, props?: { payload?: Record<string, unknown> }) => [string, string] | string;
	className?: string;
}

export function ChartTooltip({
	active,
	payload,
	label,
	labelFormatter,
	formatter,
	className
}: ChartTooltipProps) {
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const formattedLabel = labelFormatter
		? labelFormatter(label ?? '')
		: typeof label === 'number'
		? formatChartNumber(label)
		: String(label ?? '');

	return (
		<div
			className={cn(
				'bg-white rounded-lg shadow-lg border border-gray-200 p-3',
				className
			)}
		>
			{formattedLabel && (
				<p className="text-sm font-semibold text-gray-900 mb-2 border-b border-gray-200 pb-1">
					{formattedLabel}
				</p>
			)}
			<div className="space-y-1">
				{payload.map((entry, index) => {
					const name = entry.name || entry.dataKey || 'Value';
					let value: string;
					let displayName: string;

					if (formatter && entry.value != null) {
						const formatted = formatter(entry.value, name, entry);
						if (Array.isArray(formatted)) {
							value = formatted[0];
							displayName = formatted[1];
						} else {
							value = String(formatted);
							displayName = name;
						}
					} else if (typeof entry.value === 'number') {
						value = formatChartNumber(entry.value);
						displayName = name;
					} else {
						value = String(entry.value ?? '');
						displayName = name;
					}

					return (
						<div key={index} className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded-sm"
								style={{ backgroundColor: entry.color || '#3b82f6' }}
							/>
							<span className="text-sm font-medium text-gray-700">{displayName}:</span>
							<span className="text-sm font-semibold text-gray-900">{value}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

