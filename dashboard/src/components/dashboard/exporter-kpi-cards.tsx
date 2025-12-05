'use client';

import { Package, Percent, Globe } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';

interface ExporterKPICardsProps {
	totalBoxes: number;
	globalSharePercent: number;
	topCountry: string;
}

export function ExporterKPICards({
	totalBoxes,
	globalSharePercent,
	topCountry
}: ExporterKPICardsProps) {
	const formatNumber = (num: number) => {
		if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
		if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
		if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
		return num.toLocaleString();
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<KPICard
				title="Total Boxes Exported"
				value={formatNumber(totalBoxes)}
				icon={<Package className="w-6 h-6" />}
				tone="neutral"
			/>
			<KPICard
				title="Global Share %"
				value={`${globalSharePercent.toFixed(2)}%`}
				icon={<Percent className="w-6 h-6" />}
				tone="neutral"
			/>
			<KPICard
				title="Top Destination Country"
				value={topCountry}
				icon={<Globe className="w-6 h-6" />}
				tone="neutral"
			/>
		</div>
	);
}


