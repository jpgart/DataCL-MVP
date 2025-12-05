'use client';

import { KPIResult } from '@/types/exports';
import { Package, Weight, TrendingUp, Database, Users, ShoppingCart, Globe, Calendar } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';

interface KPICardsProps {
  kpis: KPIResult;
}

export function KPICards({ kpis }: KPICardsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const cards = [
    {
      title: 'Total Boxes',
      value: formatNumber(kpis.totalBoxes),
      icon: <Package className="w-6 h-6" />,
      tone: 'neutral' as const
    },
    {
      title: 'Total Kilograms',
      value: formatNumber(kpis.totalWeight),
      icon: <Weight className="w-6 h-6" />,
      tone: 'neutral' as const
    },
    {
      title: 'Average Unit Weight',
      value: `${kpis.avgUnitWeight.toFixed(2)} kg`,
      icon: <TrendingUp className="w-6 h-6" />,
      tone: 'neutral' as const
    },
    {
      title: 'Total Records',
      value: formatNumber(kpis.recordCount),
      icon: <Database className="w-6 h-6" />,
      tone: 'neutral' as const
    },
    {
      title: 'Unique Exporters',
      value: formatNumber(kpis.uniqueExporters),
      icon: <Users className="w-6 h-6" />,
      tone: 'neutral' as const
    },
    {
      title: 'Unique Products',
      value: formatNumber(kpis.uniqueProducts),
      icon: <ShoppingCart className="w-6 h-6" />,
      tone: 'neutral' as const
    },
    {
      title: 'Unique Countries',
      value: formatNumber(kpis.uniqueCountries),
      icon: <Globe className="w-6 h-6" />,
      tone: 'neutral' as const
    },
    {
      title: 'Unique Seasons',
      value: formatNumber(kpis.uniqueSeasons),
      icon: <Calendar className="w-6 h-6" />,
      tone: 'neutral' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <KPICard
            key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          tone={card.tone}
        />
      ))}
    </div>
  );
}


