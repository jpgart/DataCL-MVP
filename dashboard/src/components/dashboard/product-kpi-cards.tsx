'use client';

import { Weight, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';

interface ProductKPICardsProps {
	totalKilos: number;
	yoyChangePercent: number;
	avgPricePerKg: number;
}

export function ProductKPICards({
	totalKilos,
	yoyChangePercent,
	avgPricePerKg
}: ProductKPICardsProps) {
	const formatNumber = (num: number) => {
		if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
		if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
		if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
		return num.toLocaleString();
	};

	const isNegative = yoyChangePercent < 0;
	const hasPrice = avgPricePerKg > 0;

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<KPICard
				title="Total Kilograms Exported"
				value={`${formatNumber(totalKilos)} kg`}
				icon={<Weight className="w-6 h-6" />}
				tone="neutral"
			/>
			<KPICard
				title="% Change (vs. Previous Year)"
				value={`${yoyChangePercent >= 0 ? '+' : ''}${yoyChangePercent.toFixed(2)}%`}
				icon={isNegative ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
				tone={isNegative ? 'negative' : 'positive'}
				highlighted={isNegative}
			/>
			<KPICard
				title="Estimated Average Price (per Kg)"
				value={hasPrice ? `$${avgPricePerKg.toFixed(2)}/kg` : 'N/A'}
				icon={<DollarSign className="w-6 h-6" />}
				tone="neutral"
			/>
		</div>
	);
}


