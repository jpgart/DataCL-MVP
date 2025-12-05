'use client';

import { useState, useMemo, useCallback } from 'react';
import { ExportRecord, FilterState } from '@/types/exports';
import { DataEngine } from '@/lib/data-engine';
import { KPICards } from './kpi-cards';
import { TimeSeriesChart } from './time-series-chart';
import { RankingCharts } from './ranking-charts';
import { FiltersPanel } from './filters-panel';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { SkeletonKPICard, SkeletonChart } from '@/components/ui/skeleton';

// Importación dinámica del chat para evitar problemas con chunks en Turbopack
const AIChat = dynamic(() => import('./ai-chat').then(mod => ({ default: mod.AIChat })), {
  ssr: false
});

interface SmartDashboardProps {
  initialData: ExportRecord[];
}

export function SmartDashboard({ initialData }: SmartDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [rankingSeasonFilter, setRankingSeasonFilter] = useState<string>('');
  const [rankingProductFilter, setRankingProductFilter] = useState<string>('');

  // Crear engine base para obtener valores únicos
  const baseEngine = useMemo(() => new DataEngine(initialData), [initialData]);

  // Obtener valores únicos para los filtros
  const uniqueSeasons = useMemo(() => baseEngine.getUniqueValues('season'), [baseEngine]);
  const uniqueCountries = useMemo(() => baseEngine.getUniqueValues('country'), [baseEngine]);
  const uniqueProducts = useMemo(() => baseEngine.getUniqueValues('product'), [baseEngine]);
  const uniqueExporters = useMemo(() => baseEngine.getUniqueValues('exporter'), [baseEngine]);

  // Filtrar datos según los filtros seleccionados
  const filteredData = useMemo(() => {
    if (!filters.season && !filters.country?.length && !filters.product?.length && !filters.exporter?.length) {
      return initialData;
    }
    return baseEngine.filter(filters);
  }, [initialData, baseEngine, filters]);

  // Crear engine con datos filtrados para calcular métricas
  const filteredEngine = useMemo(() => new DataEngine(filteredData), [filteredData]);

  // Calcular métricas y datos con filtros aplicados
  const kpis = useMemo(() => filteredEngine.getKPIs(), [filteredEngine]);
  const timeSeriesData = useMemo(() => filteredEngine.getTimeSeriesData(), [filteredEngine]);
  
  // Rankings con filtros adicionales de temporada y producto
  const rankingFilteredData = useMemo(() => {
    let data = filteredData;
    if (rankingSeasonFilter) {
      data = data.filter(r => r.season === rankingSeasonFilter);
    }
    if (rankingProductFilter) {
      data = data.filter(r => r.product === rankingProductFilter);
    }
    return data;
  }, [filteredData, rankingSeasonFilter, rankingProductFilter]);

  const rankingEngine = useMemo(() => new DataEngine(rankingFilteredData), [rankingFilteredData]);

  const topExporters = useMemo(() => 
    rankingEngine.getTopExporters(5).map(item => ({
      name: item.exporter,
      boxes: item.boxes
    })),
    [rankingEngine]
  );
  const topProducts = useMemo(() => 
    rankingEngine.getTopProducts(5).map(item => ({
      name: item.product,
      boxes: item.boxes
    })),
    [rankingEngine]
  );

  // Memoize callbacks
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleRankingSeasonFilter = useCallback((season: string) => {
    setRankingSeasonFilter(season);
  }, []);

  const handleRankingProductFilter = useCallback((product: string) => {
    setRankingProductFilter(product);
  }, []);

  // Loading states
  const isLoadingKPIs = !kpis;
  const isLoadingTimeSeries = !timeSeriesData || timeSeriesData.length === 0;
  const isLoadingRankings = !topExporters || !topProducts || topExporters.length === 0 || topProducts.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-8">
          <Breadcrumb items={[{ label: 'Dashboard' }]} />
          <h1 className="text-3xl font-bold text-gray-900">AgroAnalytics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-2">
            Agricultural exports analysis - {filteredData.length.toLocaleString()} records
            {filteredData.length !== initialData.length && (
              <span className="text-blue-600 ml-2">
                (of {initialData.length.toLocaleString()} total)
              </span>
            )}
          </p>
        </header>

        {/* Sección 1: Resumen Ejecutivo */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
          {isLoadingKPIs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonKPICard key={i} />
              ))}
            </div>
          ) : (
          <KPICards kpis={kpis} />
          )}
        </section>

        {/* Sección 2: Filtros */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Filters</h2>
          <FiltersPanel
            uniqueSeasons={uniqueSeasons}
            uniqueCountries={uniqueCountries}
            uniqueProducts={uniqueProducts}
            uniqueExporters={uniqueExporters}
            onFiltersChange={handleFiltersChange}
          />
        </section>

        {/* Sección 3: Análisis Temporal */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Temporal Analysis</h2>
          {isLoadingTimeSeries ? (
            <SkeletonChart />
          ) : (
          <TimeSeriesChart data={timeSeriesData} />
          )}
        </section>

        {/* Sección 4: Rankings */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rankings</h2>
          {isLoadingRankings ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart />
              <SkeletonChart />
            </div>
          ) : (
          <RankingCharts 
            topExporters={topExporters} 
            topProducts={topProducts}
            uniqueSeasons={uniqueSeasons}
            uniqueProducts={uniqueProducts}
            selectedSeason={rankingSeasonFilter}
            selectedProduct={rankingProductFilter}
              onSeasonFilter={handleRankingSeasonFilter}
              onProductFilter={handleRankingProductFilter}
          />
          )}
        </section>

        {/* Navigation to Advanced Analysis Pages */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Link
                  href="/exporters"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-2"
                >
                  Exporter Deep Dive Analysis →
                </Link>
                <p className="text-sm text-gray-600">
                  Analyze individual exporter performance compared to competitors and over time
                </p>
              </div>
              <div>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors mb-2"
                >
                  Product Deep Dive Analysis →
                </Link>
                <p className="text-sm text-gray-600">
                  Analyze product performance, key actors, and market distribution
                </p>
              </div>
            </div>
          </div>
        </section>

        <AIChat />
      </div>
    </div>
  );
}

