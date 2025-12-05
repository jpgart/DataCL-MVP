import { loadParquetData } from '@/lib/parquet-loader';
import { DataEngine } from '@/lib/data-engine';
import type { ExportRecord } from '@/types/exports';
import {
	kpiSummarySchema,
	timeSeriesSchema,
	topCountriesSchema,
	topExportersSchema
} from '@/lib/ai-schemas';
import {
	findProductByName,
	findVariety,
	getAllProducts,
	getProductVarieties,
	findSimilarProducts,
	getProductById
} from '@/lib/product-reference';

const DEFAULT_TOP_LIMIT = 10;
const MAX_TOP_LIMIT = 50;

/**
 * Familias de productos normalizadas.
 * Estas son "categorías lógicas" que usamos para:
 * - Interpretar lo que pide el usuario (uva, uvas, grapes, etc.)
 * - Clasificar correctamente los valores reales de `record.product` del dataset.
 */
const PRODUCT_FAMILIES = [
	'table_grape',
	'blueberry',
	'kiwifruit',
	'clementine',
	'orange',
	'avocado',
	'apple',
	'cherry'
] as const;

type ProductFamily = (typeof PRODUCT_FAMILIES)[number];

/**
 * Sinónimos de entrada del usuario → familia de producto.
 * Todo en minúsculas.
 */
const PRODUCT_SYNONYMS: Record<string, ProductFamily> = {
	// Uvas → Table Grape
	'uva': 'table_grape',
	'uvas': 'table_grape',
	'uva de mesa': 'table_grape',
	'uvas de mesa': 'table_grape',
	'table grape': 'table_grape',
	'table grapes': 'table_grape',
	'grape': 'table_grape',
	'grapes': 'table_grape',

	// Kiwis → Kiwifruit
	'kiwi': 'kiwifruit',
	'kiwis': 'kiwifruit',
	'kiwifruit': 'kiwifruit',

	// Clementinas
	'clementina': 'clementine',
	'clementinas': 'clementine',
	'clementine': 'clementine',
	'clementines': 'clementine',

	// Naranjas → Oranges
	'naranja': 'orange',
	'naranjas': 'orange',
	'orange': 'orange',
	'oranges': 'orange',

	// Arándanos → Blueberry
	'arándano': 'blueberry',
	'arándanos': 'blueberry',
	'blueberry': 'blueberry',
	'blueberries': 'blueberry',

	// Paltas → Avocado
	'palta': 'avocado',
	'paltas': 'avocado',
	'avocado': 'avocado',
	'avocados': 'avocado',
	'aguacate': 'avocado',
	'aguacates': 'avocado',

	// Manzanas → Apple
	'manzana': 'apple',
	'manzanas': 'apple',
	'apple': 'apple',
	'apples': 'apple',

	// Cerezas → Cherry
	'cereza': 'cherry',
	'cerezas': 'cherry',
	'cherry': 'cherry',
	'cherries': 'cherry'
};

/**
 * Metadata para ayudar al LLM a describir bien los productos.
 * Ideal para exponer como herramienta (tool) tipo getProductFamiliesMetadata.
 */
const PRODUCT_FAMILY_METADATA: Record<
	ProductFamily,
	{
		id: ProductFamily;
		canonicalName: string; // Nombre tal como suele aparecer en el dataset
		displayName: string; // Nombre amigable para mostrar al usuario
		description: string;
		examples: string[];
	}
> = {
	table_grape: {
		id: 'table_grape',
		canonicalName: 'Table Grape',
		displayName: 'Uva de mesa (Table Grape)',
		description:
			'Uvas de mesa frescas para exportación (rojas, verdes o negras, con o sin semilla).',
		examples: ['Table Grape', 'Red Seedless Table Grape', 'Grapes Thompson Seedless']
	},
	blueberry: {
		id: 'blueberry',
		canonicalName: 'Blueberry',
		displayName: 'Arándanos (Blueberry)',
		description: 'Arándanos frescos para exportación.',
		examples: ['Blueberry', 'Blueberries']
	},
	kiwifruit: {
		id: 'kiwifruit',
		canonicalName: 'Kiwifruit',
		displayName: 'Kiwi (Kiwifruit)',
		description: 'Kiwi fresco para exportación.',
		examples: ['Kiwifruit', 'Kiwi']
	},
	clementine: {
		id: 'clementine',
		canonicalName: 'Clementine',
		displayName: 'Clementina (Clementine)',
		description: 'Clementinas frescas (cítrico similar a mandarina).',
		examples: ['Clementine', 'Clementinas']
	},
	orange: {
		id: 'orange',
		canonicalName: 'Oranges',
		displayName: 'Naranjas (Oranges)',
		description: 'Naranjas frescas para exportación.',
		examples: ['Oranges', 'Naranjas']
	},
	avocado: {
		id: 'avocado',
		canonicalName: 'Avocado',
		displayName: 'Palta / Aguacate (Avocado)',
		description: 'Paltas o aguacates para exportación.',
		examples: ['Avocado', 'Hass Avocado']
	},
	apple: {
		id: 'apple',
		canonicalName: 'Apple',
		displayName: 'Manzana (Apple)',
		description: 'Manzanas frescas para exportación.',
		examples: ['Apple', 'Royal Gala Apple', 'Fuji Apple']
	},
	cherry: {
		id: 'cherry',
		canonicalName: 'Cherry',
		displayName: 'Cereza (Cherry)',
		description: 'Cerezas frescas para exportación.',
		examples: ['Cherry', 'Fresh Cherry']
	}
};

let cachedEngine: DataEngine | null = null;
let cachedDataRef: ExportRecord[] | null = null;

async function getDataset(): Promise<ExportRecord[]> {
	return await loadParquetData();
}

async function getEngine(): Promise<DataEngine> {
	const data = await getDataset();
	if (!cachedEngine || cachedDataRef !== data) {
		cachedEngine = new DataEngine(data);
		cachedDataRef = data;
	}
	return cachedEngine;
}

/**
 * Normaliza el texto que escribe el usuario (uva, uvas, arándanos, etc.)
 * a una familia de producto clara: 'table_grape', 'blueberry', etc.
 */
function normalizeProductInput(raw?: string): ProductFamily | undefined {
	if (!raw) return undefined;
	const key = raw.trim().toLowerCase();

	if (PRODUCT_SYNONYMS[key]) {
		return PRODUCT_SYNONYMS[key];
	}

	// Fallback: heurísticas simples por palabras clave
	if (key.includes('uva') || key.includes('grape')) return 'table_grape';
	if (key.includes('aránd') || key.includes('blueber')) return 'blueberry';
	if (key.includes('kiwi')) return 'kiwifruit';
	if (key.includes('clement')) return 'clementine';
	if (key.includes('naran') || key.includes('orange')) return 'orange';
	if (key.includes('palta') || key.includes('avocado') || key.includes('aguac')) return 'avocado';
	if (key.includes('manzan') || key.includes('apple')) return 'apple';
	if (key.includes('cerez') || key.includes('cherry')) return 'cherry';

	return undefined;
}

/**
 * Clasifica el valor real de record.product en una familia.
 * Esto depende de cómo venga escrito el producto en el dataset.
 */
function classifyProductFromRecord(raw?: string): ProductFamily | undefined {
	if (!raw) return undefined;
	const p = raw.trim().toLowerCase();

	if (p.includes('table grape') || p.includes('grape') || p.includes('uva')) return 'table_grape';
	if (p.includes('kiwifruit') || p.includes('kiwi')) return 'kiwifruit';
	if (p.includes('clementine') || p.includes('clementina')) return 'clementine';
	if (p.includes('orange') || p.includes('naranja')) return 'orange';
	if (p.includes('blueber') || p.includes('aránd')) return 'blueberry';
	if (p.includes('avocado') || p.includes('palta') || p.includes('aguac')) return 'avocado';
	if (p.includes('apple') || p.includes('manzan')) return 'apple';
	if (p.includes('cherry') || p.includes('cerez')) return 'cherry';

	return undefined;
}

/**
 * Exponer metadata de productos para que el LLM pueda describirlos correctamente.
 * Ideal como tool: getProductFamiliesMetadata
 */
export async function getProductFamiliesMetadata() {
	const families = PRODUCT_FAMILIES.map(id => {
		const meta = PRODUCT_FAMILY_METADATA[id];
		return {
			id: meta.id,
			canonicalName: meta.canonicalName,
			displayName: meta.displayName,
			description: meta.description,
			examples: meta.examples
		};
	});

	console.log('[TOOLS] getProductFamiliesMetadata', { count: families.length });

	return {
		families,
		count: families.length
	};
}

export async function getGlobalKPIs() {
	const engine = await getEngine();
	const kpis = engine.getKPIs();
	const payload = {
		totalBoxes: kpis.totalBoxes,
		totalKilos: kpis.totalWeight,
		avgUnitWeight: kpis.avgUnitWeight,
		recordCount: kpis.recordCount,
		totalExporters: kpis.uniqueExporters,
		totalProducts: kpis.uniqueProducts,
		totalCountries: kpis.uniqueCountries,
		totalSeasons: kpis.uniqueSeasons
	};
	console.log('[TOOLS] getGlobalKPIs');
	return kpiSummarySchema.parse(payload);
}

export async function getTopCountriesByKilos({
	year,
	limit = DEFAULT_TOP_LIMIT
}: {
	year?: number;
	limit?: number;
}) {
	const safeLimit = Math.min(Math.max(limit ?? DEFAULT_TOP_LIMIT, 1), MAX_TOP_LIMIT);
	const data = await getDataset();
	const filtered = typeof year === 'number' ? data.filter(record => record.year === year) : data;

	const aggregated = new Map<
		string,
		{
			country: string;
			netWeightKg: number;
			boxes: number;
		}
	>();

	for (const record of filtered) {
		if (!record.country) continue;
		const current = aggregated.get(record.country) ?? {
			country: record.country,
			netWeightKg: 0,
			boxes: 0
		};
		current.netWeightKg += record.net_weight_kg;
		current.boxes += record.boxes;
		aggregated.set(record.country, current);
	}

	const items = Array.from(aggregated.values())
		.sort((a, b) => b.netWeightKg - a.netWeightKg)
		.slice(0, safeLimit)
		.map((item, index) => ({
			rank: index + 1,
			country: item.country,
			netWeightKg: Math.round(item.netWeightKg),
			boxes: Math.round(item.boxes)
		}));

	console.log('[TOOLS] getTopCountriesByKilos', { year: year ?? null, limit: safeLimit });

	return topCountriesSchema.parse({
		year: typeof year === 'number' ? year : null,
		limit: safeLimit,
		items
	});
}

/**
 * Obtiene top exportadores por kilos, usando el sistema de referencias de productos
 * para búsqueda precisa con traducciones ES/EN y nombres exactos del dataset.
 */
export async function getTopExportersByKilos({
	year,
	product,
	limit = DEFAULT_TOP_LIMIT
}: {
	year?: number;
	product?: string;
	limit?: number;
}) {
	const safeLimit = Math.min(Math.max(limit ?? DEFAULT_TOP_LIMIT, 1), MAX_TOP_LIMIT);
	const data = await getDataset();

	// Usar sistema de referencias para normalizar producto
	let searchTerms: string[] = [];
	let originalProduct: string | undefined = undefined;
	let productRef = null;

	if (product) {
		originalProduct = product.trim();
		productRef = findProductByName(originalProduct);
		
		if (productRef) {
			// Usar dataset_matches para búsqueda precisa
			searchTerms = productRef.dataset_matches.map(m => m.toLowerCase());
			console.log('[TOOLS] getTopExportersByKilos - Product found in reference', {
				query: originalProduct,
				canonical: productRef.canonical_name,
				searchTerms
			});
		} else {
			// Fallback: intentar usar PRODUCT_FAMILY_METADATA para obtener nombres reales del dataset
			const trimmed = originalProduct.toLowerCase();
			const productFamily = PRODUCT_SYNONYMS[trimmed];
			
			if (productFamily && PRODUCT_FAMILY_METADATA[productFamily]) {
				// Usar canonicalName y examples del metadata como términos de búsqueda
				const metadata = PRODUCT_FAMILY_METADATA[productFamily];
				searchTerms = [
					metadata.canonicalName.toLowerCase(),
					...metadata.examples.map(ex => ex.toLowerCase())
				].filter(Boolean);
				console.log('[TOOLS] getTopExportersByKilos - Product not in reference, using family metadata', {
					query: originalProduct,
					family: productFamily,
					canonicalName: metadata.canonicalName,
					searchTerms
				});
			} else {
				// Último fallback: usar término original directamente
				searchTerms = [trimmed];
				console.log('[TOOLS] getTopExportersByKilos - Product not in reference or metadata, using original term', {
					query: originalProduct,
					searchTerms
				});
			}
		}
	}

	// Lista de productos disponibles (para mensajes de error útiles)
	const allProducts = new Set<string>();
	data.forEach(record => {
		if (record.product && record.product.trim()) {
			allProducts.add(record.product.trim());
		}
	});
	const availableProducts = Array.from(allProducts).sort();

	// Filtro principal
	const filtered = data.filter(record => {
		const matchesYear = typeof year === 'number' ? record.year === year : true;
		if (!searchTerms.length) {
			return matchesYear;
		}
		
		// Case-insensitive matching usando términos de búsqueda
		const recordProduct = (record.product?.trim() || '').toLowerCase();
		
		const matchesProduct = searchTerms.some(term => {
			if (!term) return false;
			return (
				recordProduct === term ||
				recordProduct.includes(term) ||
				term.includes(recordProduct)
			);
		});
		
		return matchesYear && matchesProduct;
	});

	const aggregated = new Map<
		string,
		{
			exporter: string;
			netWeightKg: number;
			boxes: number;
		}
	>();

	for (const record of filtered) {
		if (!record.exporter) continue;
		const current = aggregated.get(record.exporter) ?? {
			exporter: record.exporter,
			netWeightKg: 0,
			boxes: 0
		};
		current.netWeightKg += record.net_weight_kg;
		current.boxes += record.boxes;
		aggregated.set(record.exporter, current);
	}

	const items = Array.from(aggregated.values())
		.sort((a, b) => b.netWeightKg - a.netWeightKg)
		.slice(0, safeLimit)
		.map((item, index) => ({
			rank: index + 1,
			exporter: item.exporter,
			netWeightKg: Math.round(item.netWeightKg),
			boxes: Math.round(item.boxes)
		}));

	console.log('[TOOLS] getTopExportersByKilos', {
		year: year ?? null,
		product: productRef?.canonical_name ?? originalProduct ?? null,
		searchTerms: searchTerms,
		limit: safeLimit,
		filteredCount: filtered.length
	});

	if (items.length === 0) {
		// Provide helpful error message with available products
		const productHint = originalProduct 
			? `\n\nSearched for: "${originalProduct}"${productRef ? ` (found as: "${productRef.canonical_name}")` : ''}\n` +
			  `Available products in dataset: ${availableProducts.slice(0, 10).join(', ')}${availableProducts.length > 10 ? '...' : ''}`
			: '';
		
		throw new Error(
			`No exporters found for product "${originalProduct || 'unspecified'}"${year ? ` in year ${year}` : ''}.${productHint}`
		);
	}

	return topExportersSchema.parse({
		year: typeof year === 'number' ? year : null,
		product: productRef?.canonical_name ?? originalProduct ?? null,
		limit: safeLimit,
		items
	});
}

export async function getAvailableProducts() {
	const data = await getDataset();
	const products = new Set<string>();
	data.forEach(record => {
		if (record.product && record.product.trim()) {
			products.add(record.product.trim());
		}
	});
	const sortedProducts = Array.from(products).sort();
	console.log('[TOOLS] getAvailableProducts', { count: sortedProducts.length });
	return {
		products: sortedProducts,
		count: sortedProducts.length
	};
}

/**
 * Obtiene referencia completa de un producto o variedad, incluyendo traducciones ES/EN
 * y nombres exactos del dataset. Ideal para que Gemini entienda qué buscar.
 */
export async function getProductReference({
	product,
	variety
}: {
	product?: string;
	variety?: string;
}) {
	console.log('[TOOLS] getProductReference', { product, variety });
	
	// Si no se especifica producto, retornar todos los productos
	if (!product) {
		const allProducts = getAllProducts();
		return {
			found: false,
			all_products: allProducts.map(p => ({
				id: p.id,
				canonical_name: p.canonical_name,
				names: p.names,
				description: p.description,
				record_count: p.record_count
			})),
			count: allProducts.length,
			message: 'No product specified. Returning all available products.'
		};
	}
	
	// Buscar producto
	const productRef = findProductByName(product);
	
	if (!productRef) {
		// Buscar productos similares
		const similar = findSimilarProducts(product, 5);
		return {
			found: false,
			message: `Product "${product}" not found in reference`,
			suggestions: similar.map(p => ({
				id: p.id,
				canonical_name: p.canonical_name,
				names: p.names,
				description: p.description
			})),
			all_products_count: getAllProducts().length
		};
	}
	
	// Si se especifica variedad, buscar también la variedad
	let varietyRef = null;
	if (variety) {
		varietyRef = findVariety(productRef.id, variety);
	}
	
	// Retornar referencia completa
	const result: {
		found: boolean;
		product: typeof productRef;
		variety?: typeof varietyRef | null;
		dataset_search_terms: string[];
		available_varieties?: Array<{ names: { en: string[]; es: string[] }; dataset_matches: string[] }>;
		message?: string;
	} = {
		found: true,
		product: productRef,
		dataset_search_terms: productRef.dataset_matches,
		available_varieties: getProductVarieties(productRef.id).map(v => ({
			names: v.names,
			dataset_matches: v.dataset_matches
		}))
	};
	
	if (variety) {
		result.variety = varietyRef;
		if (varietyRef) {
			result.dataset_search_terms = [
				...productRef.dataset_matches,
				...varietyRef.dataset_matches
			];
		} else {
			result.message = `Variety "${variety}" not found for product "${productRef.canonical_name}". Available varieties: ${getProductVarieties(productRef.id).slice(0, 10).map(v => v.dataset_matches[0]).join(', ')}`;
		}
	}
	
	return result;
}

export async function getTimeSeriesByCountry({ country }: { country: string }) {
	const trimmedCountry = country.trim();
	if (!trimmedCountry) {
		throw new Error('Country cannot be empty');
	}

	const normalized = trimmedCountry.toLowerCase();
	const data = await getDataset();

	const yearly = new Map<
		number,
		{
			year: number;
			netWeightKg: number;
			boxes: number;
		}
	>();

	for (const record of data) {
		if (!record.country) continue;
		if (record.country.toLowerCase() !== normalized) continue;
		const current = yearly.get(record.year) ?? {
			year: record.year,
			netWeightKg: 0,
			boxes: 0
		};
		current.netWeightKg += record.net_weight_kg;
		current.boxes += record.boxes;
		yearly.set(record.year, current);
	}

	const points = Array.from(yearly.values()).sort((a, b) => a.year - b.year);

	console.log('[TOOLS] getTimeSeriesByCountry', {
		country: trimmedCountry,
		points: points.length
	});

	return timeSeriesSchema.parse({
		country: trimmedCountry,
		points: points.map(point => ({
			year: point.year,
			netWeightKg: Math.round(point.netWeightKg),
			boxes: Math.round(point.boxes)
		}))
	});
}