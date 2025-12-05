import { ExportRecord } from '@/types/exports';
import { dataCache } from './data-cache';

/**
 * Carga los datos del Parquet usando el caché en memoria
 * Esto es más eficiente que hacer fetch HTTP ya que evita serialización/deserialización
 */
export async function loadParquetData(): Promise<ExportRecord[]> {
	try {
		const records = await dataCache.getData();
		return records;
	} catch (error) {
		console.error(`[FATAL] No se pudo cargar los datos:`, error);
		return [];
	}
}
