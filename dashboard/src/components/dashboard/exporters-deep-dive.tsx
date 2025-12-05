'use client';

import { useState, useMemo, useCallback } from 'react';
import { ExportRecord } from '@/types/exports';
import { DataEngine } from '@/lib/data-engine';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { BackToDashboard } from '@/components/ui/back-to-dashboard';
import { SkeletonKPICard, SkeletonChart } from '@/components/ui/skeleton';
import { ExporterKPICards } from './exporter-kpi-cards';
import { ExporterProductsChart } from './exporter-products-chart';
import { ExporterCountriesChart } from './exporter-countries-chart';
import { ExporterYoYTrend } from './exporter-yoy-trend';
import { ExporterCompetitive } from './exporter-competitive';

interface ExportersDeepDiveProps {
	initialData: ExportRecord[];
}

export function ExportersDeepDive({ initialData }: ExportersDeepDiveProps) {
	const [selectedExporter, setSelectedExporter] = useState<string>('');
	const [selectedSeason, setSelectedSeason] = useState<string>('');
	const [selectedProduct, setSelectedProduct] = useState<string>('');

	const baseEngine = useMemo(() => new DataEngine(initialData), [initialData]);

	const uniqueExporters = useMemo(() => baseEngine.getUniqueValues('exporter'), [baseEngine]);
	const uniqueSeasons = useMemo(() => baseEngine.getUniqueValues('season'), [baseEngine]);
	const uniqueProducts = useMemo(() => baseEngine.getUniqueValues('product'), [baseEngine]);

	// Get current and previous season for YoY comparison
	const seasons = useMemo(() => {
		const sorted = [...uniqueSeasons].sort();
		return sorted;
	}, [uniqueSeasons]);

	const currentSeason = useMemo(() => {
		if (selectedSeason) return selectedSeason;
		return seasons.length > 0 ? seasons[seasons.length - 1] : '';
	}, [selectedSeason, seasons]);

	const previousSeason = useMemo(() => {
		if (!currentSeason) return '';
		const currentIndex = seasons.indexOf(currentSeason);
		return currentIndex > 0 ? seasons[currentIndex - 1] : '';
	}, [currentSeason, seasons]);

	// Calculate exporter KPIs
	const exporterKPIs = useMemo(() => {
		if (!selectedExporter) return null;
		return baseEngine.getExporterKPIs(selectedExporter, selectedSeason || undefined, selectedProduct || undefined);
	}, [baseEngine, selectedExporter, selectedSeason, selectedProduct]);

	// Get top products for exporter
	const topProducts = useMemo(() => {
		if (!selectedExporter) return [];
		return baseEngine.getExporterTopProducts(selectedExporter, selectedSeason || undefined, 5);
	}, [baseEngine, selectedExporter, selectedSeason]);

	// Get country distribution for exporter
	const countryDistribution = useMemo(() => {
		if (!selectedExporter) return [];
		return baseEngine.getExporterCountryDistribution(selectedExporter, selectedSeason || undefined);
	}, [baseEngine, selectedExporter, selectedSeason]);

	// Get YoY trend data
	const yoyData = useMemo(() => {
		if (!selectedExporter || !currentSeason || !previousSeason) return [];
		return baseEngine.getExporterTimeSeriesYoY(selectedExporter, currentSeason, previousSeason);
	}, [baseEngine, selectedExporter, currentSeason, previousSeason]);

	// Get competitive positioning
	const competitiveData = useMemo(() => {
		if (!selectedExporter) return [];
		return baseEngine.getCompetitivePositioning(selectedExporter, selectedSeason || undefined, 5);
	}, [baseEngine, selectedExporter, selectedSeason]);

	// Prepare data for charts
	const productsChartData = useMemo(() => {
		return topProducts.map(item => ({
			product: item.product,
			boxes: item.boxes
		}));
	}, [topProducts]);

	const hasData = selectedExporter && exporterKPIs;

	// Memoize callbacks
	const handleExporterChange = useCallback((exporter: string) => {
		setSelectedExporter(exporter);
	}, []);

	const handleSeasonChange = useCallback((season: string) => {
		setSelectedSeason(season);
	}, []);

	const handleProductChange = useCallback((product: string) => {
		setSelectedProduct(product);
	}, []);

	// Loading states
	const isLoadingKPIs = !exporterKPIs;
	const isLoadingCharts = !hasData;

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto px-6">
				<header className="mb-8">
					<Breadcrumb
						items={[
							{ label: 'Dashboard', href: '/' },
							{ label: 'Exporter Analysis' }
						]}
					/>
					<div className="mb-4">
						<BackToDashboard />
					</div>
					<h1 className="text-3xl font-bold text-gray-900">Exporter Deep Dive Analysis</h1>
					<p className="text-sm text-gray-600 mt-2">
						Analyze individual exporter performance compared to competitors and over time
					</p>
				</header>

				{/* Filters Section */}
				<section className="mb-8">
					<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Exporter <span className="text-red-500">*</span>
								</label>
								<select
									value={selectedExporter}
									onChange={(e) => handleExporterChange(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								>
									<option value="">Select an exporter...</option>
									{uniqueExporters.map(exporter => (
										<option key={exporter} value={exporter}>
											{exporter}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Season
								</label>
								<select
									value={selectedSeason}
									onChange={(e) => handleSeasonChange(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">All seasons</option>
									{uniqueSeasons.map(season => (
										<option key={season} value={season}>
											{season}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Product
								</label>
								<select
									value={selectedProduct}
									onChange={(e) => handleProductChange(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">All products</option>
									{uniqueProducts.map(product => (
										<option key={product} value={product}>
											{product}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
				</section>

				{/* Show message if no exporter selected */}
				{!selectedExporter && (
					<div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
						<p className="text-gray-500 text-base">
							Please select an exporter from the filters above to view detailed analysis.
						</p>
					</div>
				)}

				{/* Show data when exporter is selected */}
				{hasData && (
					<>
						{/* Section 1: Key Metrics */}
						<section className="mb-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">Key Metrics</h2>
							{isLoadingKPIs ? (
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									{Array.from({ length: 3 }).map((_, i) => (
										<SkeletonKPICard key={i} />
									))}
								</div>
							) : (
								<ExporterKPICards
									totalBoxes={exporterKPIs.totalBoxes}
									globalSharePercent={exporterKPIs.globalSharePercent}
									topCountry={exporterKPIs.topCountry}
								/>
							)}
						</section>

						{/* Section 2: Dimensional Distribution */}
						<section className="mb-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">Dimensional Distribution</h2>
							{isLoadingCharts ? (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<SkeletonChart />
									<SkeletonChart />
								</div>
							) : (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<ExporterProductsChart data={productsChartData} />
									<ExporterCountriesChart data={countryDistribution} />
								</div>
							)}
						</section>

						{/* Section 3: Trend and Comparison */}
						<section className="mb-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">Trend and Comparison</h2>
							{isLoadingCharts ? (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<SkeletonChart />
									<SkeletonChart />
								</div>
							) : (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{yoyData.length > 0 && currentSeason && previousSeason ? (
										<ExporterYoYTrend
											data={yoyData}
											currentSeason={currentSeason}
											previousSeason={previousSeason}
										/>
									) : (
										<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
											<h2 className="text-xl font-semibold text-gray-900 mb-4">
												Weekly Box Trend (YoY Comparison)
											</h2>
											<div className="flex items-center justify-center h-64 text-gray-500">
												No YoY comparison data available (previous season data required)
											</div>
										</div>
									)}
									<ExporterCompetitive
										data={competitiveData}
										selectedExporter={selectedExporter}
									/>
								</div>
							)}
						</section>
					</>
				)}
			</div>
		</div>
	);
}

