'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FilterState } from '@/types/exports';
import { X, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { FilterChip } from '@/components/ui/filter-chip';
import { Card } from '@/components/ui/card';

interface FiltersPanelProps {
	uniqueSeasons: string[];
	uniqueCountries: string[];
	uniqueProducts: string[];
	uniqueExporters: string[];
	onFiltersChange: (filters: FilterState) => void;
}

export function FiltersPanel({
	uniqueSeasons,
	uniqueCountries,
	uniqueProducts,
	uniqueExporters,
	onFiltersChange
}: FiltersPanelProps) {
	const [selectedSeason, setSelectedSeason] = useState<string>('');
	const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
	const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
	const [selectedExporters, setSelectedExporters] = useState<string[]>([]);
	const [isExpanded, setIsExpanded] = useState(false);
	const [searchCountry, setSearchCountry] = useState('');
	const [searchProduct, setSearchProduct] = useState('');
	const [searchExporter, setSearchExporter] = useState('');

	// Debounce search inputs
	const debouncedSearchCountry = useDebounce(searchCountry, 300);
	const debouncedSearchProduct = useDebounce(searchProduct, 300);
	const debouncedSearchExporter = useDebounce(searchExporter, 300);

	// Notificar cambios de filtros
	useEffect(() => {
		const filters: FilterState = {
			season: selectedSeason || undefined,
			country: selectedCountries.length > 0 ? selectedCountries : undefined,
			product: selectedProducts.length > 0 ? selectedProducts : undefined,
			exporter: selectedExporters.length > 0 ? selectedExporters : undefined
		};
		onFiltersChange(filters);
	}, [selectedSeason, selectedCountries, selectedProducts, selectedExporters, onFiltersChange]);

	const handleCountryToggle = useCallback((country: string) => {
		setSelectedCountries(prev =>
			prev.includes(country)
				? prev.filter(c => c !== country)
				: [...prev, country]
		);
	}, []);

	const handleProductToggle = useCallback((product: string) => {
		setSelectedProducts(prev =>
			prev.includes(product)
				? prev.filter(p => p !== product)
				: [...prev, product]
		);
	}, []);

	const handleExporterToggle = useCallback((exporter: string) => {
		setSelectedExporters(prev =>
			prev.includes(exporter)
				? prev.filter(e => e !== exporter)
				: [...prev, exporter]
		);
	}, []);

	const clearAllFilters = useCallback(() => {
		setSelectedSeason('');
		setSelectedCountries([]);
		setSelectedProducts([]);
		setSelectedExporters([]);
		setSearchCountry('');
		setSearchProduct('');
		setSearchExporter('');
	}, []);

	// Filtrar listas por búsqueda (usando debounced values)
	const filteredCountries = useMemo(() => {
		if (!debouncedSearchCountry) return uniqueCountries;
		return uniqueCountries.filter(c =>
			c.toLowerCase().includes(debouncedSearchCountry.toLowerCase())
	);
	}, [uniqueCountries, debouncedSearchCountry]);

	const filteredProducts = useMemo(() => {
		if (!debouncedSearchProduct) return uniqueProducts;
		return uniqueProducts.filter(p =>
			p.toLowerCase().includes(debouncedSearchProduct.toLowerCase())
	);
	}, [uniqueProducts, debouncedSearchProduct]);

	const filteredExporters = useMemo(() => {
		if (!debouncedSearchExporter) return uniqueExporters;
		return uniqueExporters.filter(e =>
			e.toLowerCase().includes(debouncedSearchExporter.toLowerCase())
		);
	}, [uniqueExporters, debouncedSearchExporter]);

	// Prepare items for virtualized lists
	const countryItems = useMemo(() => 
		filteredCountries.map(c => ({ label: c, value: c })),
		[filteredCountries]
	);

	const productItems = useMemo(() => 
		filteredProducts.map(p => ({ label: p, value: p })),
		[filteredProducts]
	);

	const exporterItems = useMemo(() => 
		filteredExporters.map(e => ({ label: e, value: e })),
		[filteredExporters]
	);

	const activeFiltersCount =
		(selectedSeason ? 1 : 0) +
		selectedCountries.length +
		selectedProducts.length +
		selectedExporters.length;

	return (
		<Card className="mb-8">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<Filter className="w-5 h-5 text-gray-600" />
					<h2 className="text-xl font-semibold text-gray-900">Filters</h2>
					{activeFiltersCount > 0 && (
						<span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
							{activeFiltersCount} active
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{activeFiltersCount > 0 && (
						<button
							onClick={clearAllFilters}
							className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
						>
							<X className="w-4 h-4" />
							Clear all
						</button>
					)}
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="text-sm text-blue-600 hover:text-blue-700"
					>
						{isExpanded ? 'Hide' : 'Show'}
					</button>
				</div>
			</div>

			{/* Active Filters Section */}
			{activeFiltersCount > 0 && (
				<div className="mb-4 pb-4 border-b border-gray-200">
					<p className="text-sm text-gray-600 mb-2">Active Filters:</p>
					<div className="flex flex-wrap gap-2">
						{selectedSeason && (
							<FilterChip
								label={`Season: ${selectedSeason}`}
								onRemove={() => setSelectedSeason('')}
							/>
						)}
						{selectedCountries.map(country => (
							<FilterChip
								key={country}
								label={country}
								onRemove={() => handleCountryToggle(country)}
							/>
						))}
						{selectedProducts.map(product => (
							<FilterChip
								key={product}
								label={product}
								onRemove={() => handleProductToggle(product)}
							/>
						))}
						{selectedExporters.map(exporter => (
							<FilterChip
								key={exporter}
								label={`Exporter: ${exporter}`}
								onRemove={() => handleExporterToggle(exporter)}
							/>
						))}
					</div>
				</div>
			)}

			{isExpanded && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{/* Filtro por Temporada */}
					<div>
						<label className="block text-sm text-gray-600 mb-2">
							Season
						</label>
						<select
							value={selectedSeason}
							onChange={(e) => setSelectedSeason(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						>
							<option value="">All seasons</option>
							{uniqueSeasons.map(season => (
								<option key={season} value={season}>
									{season}
								</option>
							))}
						</select>
					</div>

					{/* Filtro por Países */}
					<div>
						<label className="block text-sm text-gray-600 mb-2">
							Countries ({selectedCountries.length} selected)
						</label>
						<input
							type="text"
							placeholder="Search country..."
							value={searchCountry}
							onChange={(e) => setSearchCountry(e.target.value)}
							className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						/>
						<VirtualizedList
							items={countryItems}
							selectedValues={selectedCountries}
							onSelect={handleCountryToggle}
							maxHeight={200}
						/>
					</div>

					{/* Filtro por Productos */}
					<div>
						<label className="block text-sm text-gray-600 mb-2">
							Products ({selectedProducts.length} selected)
						</label>
						<input
							type="text"
							placeholder="Search product..."
							value={searchProduct}
							onChange={(e) => setSearchProduct(e.target.value)}
							className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						/>
						<VirtualizedList
							items={productItems}
							selectedValues={selectedProducts}
							onSelect={handleProductToggle}
							maxHeight={200}
						/>
					</div>

					{/* Filtro por Exportadores */}
					<div>
						<label className="block text-sm text-gray-600 mb-2">
							Exporters ({selectedExporters.length} selected)
						</label>
						<input
							type="text"
							placeholder="Search exporter..."
							value={searchExporter}
							onChange={(e) => setSearchExporter(e.target.value)}
							className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
						/>
						<VirtualizedList
							items={exporterItems}
							selectedValues={selectedExporters}
							onSelect={handleExporterToggle}
							maxHeight={200}
						/>
					</div>
				</div>
			)}
		</Card>
	);
}

