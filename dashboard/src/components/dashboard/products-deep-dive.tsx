'use client';

import { useState, useMemo, useCallback } from 'react';
import { ExportRecord } from '@/types/exports';
import { DataEngine } from '@/lib/data-engine';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { BackToDashboard } from '@/components/ui/back-to-dashboard';
import { SkeletonKPICard, SkeletonChart } from '@/components/ui/skeleton';
import { ProductKPICards } from './product-kpi-cards';
import { ProductExportersChart } from './product-exporters-chart';
import { ProductCountriesTreemap } from './product-countries-treemap';
import { ProductDualTrend } from './product-dual-trend';
import { ProductVarietyComposition } from './product-variety-composition';

interface ProductsDeepDiveProps {
	initialData: ExportRecord[];
}

export function ProductsDeepDive({ initialData }: ProductsDeepDiveProps) {
	const [selectedProduct, setSelectedProduct] = useState<string>('');
	const [selectedSeason, setSelectedSeason] = useState<string>('');
	const [selectedRegion, setSelectedRegion] = useState<string>('');

	const baseEngine = useMemo(() => new DataEngine(initialData), [initialData]);

	const uniqueProducts = useMemo(() => baseEngine.getUniqueValues('product'), [baseEngine]);
	const uniqueSeasons = useMemo(() => baseEngine.getUniqueValues('season'), [baseEngine]);
	const uniqueRegions = useMemo(() => baseEngine.getUniqueValues('region'), [baseEngine]);

	// Get last 3 seasons for variety composition
	const seasons = useMemo(() => {
		const sorted = [...uniqueSeasons].sort();
		return sorted.slice(-3); // Last 3 seasons
	}, [uniqueSeasons]);

	// Calculate product KPIs
	const productKPIs = useMemo(() => {
		if (!selectedProduct) return null;
		return baseEngine.getProductKPIs(selectedProduct, selectedSeason || undefined, selectedRegion || undefined);
	}, [baseEngine, selectedProduct, selectedSeason, selectedRegion]);

	// Get top exporters for product
	const topExporters = useMemo(() => {
		if (!selectedProduct) return [];
		return baseEngine.getProductTopExporters(selectedProduct, selectedSeason || undefined, 10);
	}, [baseEngine, selectedProduct, selectedSeason]);

	// Get country distribution for product
	const countryDistribution = useMemo(() => {
		if (!selectedProduct) return [];
		return baseEngine.getProductCountryDistribution(selectedProduct, selectedSeason || undefined);
	}, [baseEngine, selectedProduct, selectedSeason]);

	// Get dual time series (boxes vs price)
	const dualTimeSeries = useMemo(() => {
		if (!selectedProduct) return [];
		return baseEngine.getProductDualTimeSeries(selectedProduct, selectedSeason || undefined);
	}, [baseEngine, selectedProduct, selectedSeason]);

	// Get variety composition
	const varietyComposition = useMemo(() => {
		if (!selectedProduct || seasons.length === 0) return [];
		return baseEngine.getProductVarietyComposition(selectedProduct, seasons);
	}, [baseEngine, selectedProduct, seasons]);

	const hasData = selectedProduct && productKPIs;

	// Memoize callbacks
	const handleProductChange = useCallback((product: string) => {
		setSelectedProduct(product);
	}, []);

	const handleSeasonChange = useCallback((season: string) => {
		setSelectedSeason(season);
	}, []);

	const handleRegionChange = useCallback((region: string) => {
		setSelectedRegion(region);
	}, []);

	// Loading states
	const isLoadingKPIs = !productKPIs;
	const isLoadingCharts = !hasData;

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto px-6">
				<header className="mb-8">
					<Breadcrumb
						items={[
							{ label: 'Dashboard', href: '/' },
							{ label: 'Product Analysis' }
						]}
					/>
					<div className="mb-4">
						<BackToDashboard />
					</div>
					<h1 className="text-3xl font-bold text-gray-900">Product Deep Dive Analysis</h1>
					<p className="text-sm text-gray-600 mt-2">
						Analyze product performance, key actors, and market distribution
					</p>
				</header>

				{/* Filters Section */}
				<section className="mb-8">
					<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Product <span className="text-red-500">*</span>
								</label>
								<select
									value={selectedProduct}
									onChange={(e) => handleProductChange(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								>
									<option value="">Select a product...</option>
									{uniqueProducts.map(product => (
										<option key={product} value={product}>
											{product}
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
									Destination Region
								</label>
								<select
									value={selectedRegion}
									onChange={(e) => handleRegionChange(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="">All regions</option>
									{uniqueRegions.map(region => (
										<option key={region} value={region}>
											{region}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
				</section>

				{/* Show message if no product selected */}
				{!selectedProduct && (
					<div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
						<p className="text-gray-500 text-base">
							Please select a product from the filters above to view detailed analysis.
						</p>
					</div>
				)}

				{/* Show data when product is selected */}
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
								<ProductKPICards
									totalKilos={productKPIs.totalKilos}
									yoyChangePercent={productKPIs.yoyChangePercent}
									avgPricePerKg={productKPIs.avgPricePerKg}
								/>
							)}
						</section>

						{/* Section 2: Key Actors and Distribution */}
						<section className="mb-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">Key Actors and Distribution</h2>
							{isLoadingCharts ? (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<SkeletonChart />
									<SkeletonChart />
								</div>
							) : (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<ProductExportersChart data={topExporters} />
									<ProductCountriesTreemap data={countryDistribution} />
								</div>
							)}
						</section>

						{/* Section 3: Performance and Variety Analysis */}
						<section className="mb-8">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">Performance and Variety Analysis</h2>
							{isLoadingCharts ? (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<SkeletonChart />
									<SkeletonChart />
								</div>
							) : (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{dualTimeSeries.length > 0 ? (
										<ProductDualTrend data={dualTimeSeries} />
									) : (
										<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
											<h2 className="text-xl font-semibold text-gray-900 mb-4">
												Annual Trend of Boxes vs. Average Price
											</h2>
											<div className="flex items-center justify-center h-64 text-gray-500">
												No trend data available (price data may not be available)
											</div>
										</div>
									)}
									{varietyComposition.length > 0 ? (
										<ProductVarietyComposition data={varietyComposition} />
									) : (
										<div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
											<h2 className="text-xl font-semibold text-gray-900 mb-4">
												Variety Composition by Season
											</h2>
											<div className="flex items-center justify-center h-64 text-gray-500">
												No variety data available for this product
											</div>
										</div>
									)}
								</div>
							)}
						</section>
					</>
				)}
			</div>
		</div>
	);
}

