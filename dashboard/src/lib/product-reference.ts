/**
 * Utilidades para buscar y normalizar productos y variedades
 * usando el archivo de referencia product-variety-reference.json
 */

export interface ProductReference {
	id: string;
	canonical_name: string;
	names: {
		en: string[];
		es: string[];
	};
	dataset_matches: string[];
	description: {
		en: string;
		es: string;
	};
	record_count: number;
	variety_count: number;
	varieties: {
		common: string[];
		dataset_varieties: string[];
	};
}

export interface VarietyReference {
	names: {
		en: string[];
		es: string[];
	};
	dataset_matches: string[];
	record_count?: number;
}

interface ProductReferenceData {
	metadata: {
		source_dataset: string;
		total_records: number;
		total_products: number;
		extraction_date: string;
	};
	products: Record<string, ProductReference>;
	varieties: Record<string, Record<string, VarietyReference>>;
}

// Importar JSON de forma dinámica para evitar problemas con TypeScript
let referenceData: ProductReferenceData;

// Lazy load del JSON
function getReferenceData(): ProductReferenceData {
	if (!referenceData) {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		referenceData = require('./product-variety-reference.json') as ProductReferenceData;
	}
	return referenceData;
}

/**
 * Busca un producto por cualquier nombre (ES/EN) y retorna su referencia completa
 */
export function findProductByName(query: string): ProductReference | null {
	if (!query || !query.trim()) return null;
	
	const normalized = query.trim().toLowerCase();
	const data = getReferenceData();
	
	for (const product of Object.values(data.products)) {
		// Buscar en nombres en inglés
		if (product.names.en.some(name => name.toLowerCase() === normalized)) {
			return product;
		}
		// Buscar en nombres en español
		if (product.names.es.some(name => name.toLowerCase() === normalized)) {
			return product;
		}
		// Buscar en matches del dataset
		if (product.dataset_matches.some(match => match.toLowerCase() === normalized)) {
			return product;
		}
		// Búsqueda parcial (contains)
		if (product.names.en.some(name => name.toLowerCase().includes(normalized)) ||
			product.names.es.some(name => name.toLowerCase().includes(normalized)) ||
			product.dataset_matches.some(match => match.toLowerCase().includes(normalized))) {
			return product;
		}
	}
	
	return null;
}

/**
 * Busca una variedad por producto y nombre de variedad
 */
export function findVariety(productId: string, varietyQuery: string): VarietyReference | null {
	if (!varietyQuery || !varietyQuery.trim()) return null;
	if (!productId) return null;
	
	const normalized = varietyQuery.trim().toLowerCase();
	const data = getReferenceData();
	const productVarieties = data.varieties[productId];
	
	if (!productVarieties) return null;
	
	for (const variety of Object.values(productVarieties)) {
		if (variety.names.en.some(name => name.toLowerCase() === normalized) ||
			variety.names.es.some(name => name.toLowerCase() === normalized) ||
			variety.dataset_matches.some(match => match.toLowerCase() === normalized)) {
			return variety;
		}
		// Búsqueda parcial
		if (variety.names.en.some(name => name.toLowerCase().includes(normalized)) ||
			variety.names.es.some(name => name.toLowerCase().includes(normalized)) ||
			variety.dataset_matches.some(match => match.toLowerCase().includes(normalized))) {
			return variety;
		}
	}
	
	return null;
}

/**
 * Obtiene todos los productos con sus referencias
 */
export function getAllProducts(): ProductReference[] {
	const data = getReferenceData();
	return Object.values(data.products);
}

/**
 * Obtiene todas las variedades de un producto
 */
export function getProductVarieties(productId: string): VarietyReference[] {
	const data = getReferenceData();
	const varieties = data.varieties[productId];
	return varieties ? Object.values(varieties) : [];
}

/**
 * Normaliza un nombre de producto/variedad a los nombres exactos del dataset
 * Retorna un array de términos de búsqueda que se pueden usar para filtrar
 */
export function normalizeToDatasetName(product: string, variety?: string): {
	productTerms: string[];
	varietyTerms: string[];
} {
	const productRef = findProductByName(product);
	const productTerms = productRef 
		? productRef.dataset_matches.map(m => m.toLowerCase())
		: [product.toLowerCase()];
	
	let varietyTerms: string[] = [];
	if (variety && productRef) {
		const varietyRef = findVariety(productRef.id, variety);
		varietyTerms = varietyRef
			? varietyRef.dataset_matches.map(m => m.toLowerCase())
			: [variety.toLowerCase()];
	}
	
	return { productTerms, varietyTerms };
}

/**
 * Busca productos similares (fuzzy match) cuando no se encuentra una coincidencia exacta
 */
export function findSimilarProducts(query: string, limit: number = 5): ProductReference[] {
	if (!query || !query.trim()) return [];
	
	const normalized = query.trim().toLowerCase();
	const scores: Array<{ product: ProductReference; score: number }> = [];
	const data = getReferenceData();
	
	for (const product of Object.values(data.products)) {
		let score = 0;
		
		// Coincidencia exacta en nombres
		if (product.names.en.some(name => name.toLowerCase() === normalized) ||
			product.names.es.some(name => name.toLowerCase() === normalized)) {
			score += 100;
		}
		
		// Coincidencia parcial en nombres
		if (product.names.en.some(name => name.toLowerCase().includes(normalized)) ||
			product.names.es.some(name => name.toLowerCase().includes(normalized))) {
			score += 50;
		}
		
		// Coincidencia en canonical_name
		if (product.canonical_name.toLowerCase().includes(normalized)) {
			score += 30;
		}
		
		// Coincidencia en ID
		if (product.id.includes(normalized)) {
			score += 20;
		}
		
		if (score > 0) {
			scores.push({ product, score });
		}
	}
	
	return scores
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(item => item.product);
}

/**
 * Obtiene el producto por su ID canónico
 */
export function getProductById(productId: string): ProductReference | null {
	const data = getReferenceData();
	return data.products[productId] || null;
}

