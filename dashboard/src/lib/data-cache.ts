import { ExportRecord } from '@/types/exports';
import { spawn } from 'child_process';
import { access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';

const DEFAULT_PARQUET_PATH = path.resolve(
	process.cwd(),
	'..',
	'data',
	'dataset_dashboard_mvp.parquet'
);
const PARQUET_PATH = process.env.DATA_DASHBOARD_PATH?.trim() || DEFAULT_PARQUET_PATH;
const PYTHON_EXECUTABLE = process.env.DATA_PYTHON_BIN?.trim() || 'python3';

const DEFAULT_MAX_CHUNK_SIZE = 512 * 1024 * 1024; // 512MB por defecto
const MAX_CHUNK_ENV = process.env.DATA_CACHE_MAX_CHUNK_BYTES;
const MAX_CHUNK_SIZE =
	MAX_CHUNK_ENV && !Number.isNaN(Number(MAX_CHUNK_ENV)) && Number(MAX_CHUNK_ENV) > 0
		? Number(MAX_CHUNK_ENV)
		: DEFAULT_MAX_CHUNK_SIZE;

const ROW_LIMIT_ENV = process.env.DATA_CACHE_ROW_LIMIT;
const DATA_CACHE_ROW_LIMIT =
	ROW_LIMIT_ENV && !Number.isNaN(Number(ROW_LIMIT_ENV)) && Number(ROW_LIMIT_ENV) > 0
		? Number(ROW_LIMIT_ENV)
		: null;

const EXPORT_COLUMNS = [
	'season',
	'year',
	'week',
	'absolute_season_week',
	'region',
	'market',
	'country',
	'transport',
	'product',
	'variety',
	'importer',
	'exporter',
	'port_destination',
	'boxes',
	'net_weight_kg',
	'unit_weight_kg',
	'is_outlier'
];

const SELECT_COLUMNS_ENABLED = process.env.DATA_CACHE_SELECT_COLUMNS === 'true';

type RawExportRecord = Partial<ExportRecord> & Record<string, unknown>;

// Timeout para el proceso de Python (5 minutos)
const PYTHON_TIMEOUT = 5 * 60 * 1000;
const END_OF_STREAM_MARKER = '__END__';

interface LoadingStatus {
	isLoading: boolean;
	loaded: number;
	totalBytes: number;
	bytesMB: number;
	rate: number; // registros por segundo
	estimatedTotal?: number; // estimación del total de registros
	percentage?: number; // porcentaje estimado
}

class DataCache {
	private data: ExportRecord[] | null = null;
	private loadingPromise: Promise<ExportRecord[]> | null = null;
	private lastError: Error | null = null;
	private loadingStatus: LoadingStatus = {
		isLoading: false,
		loaded: 0,
		totalBytes: 0,
		bytesMB: 0,
		rate: 0
	};

	/**
	 * Valida que el archivo Parquet exista y sea accesible
	 */
	private async validateParquetFile(): Promise<void> {
		try {
			await access(PARQUET_PATH, constants.F_OK | constants.R_OK);
		} catch {
			throw new Error(`Archivo Parquet no encontrado o no accesible: ${PARQUET_PATH}`);
		}
	}

	/**
	 * Carga los datos del Parquet usando streaming en chunks
	 * Procesa los datos línea por línea para evitar problemas de longitud de cadena
	 */
	private async loadData(): Promise<ExportRecord[]> {
		// Validar que el archivo existe antes de intentar leerlo
		await this.validateParquetFile();

		return new Promise<ExportRecord[]>((resolve, reject) => {
			const startTime = Date.now();
			const PROGRESS_INTERVAL = 50000; // Mostrar progreso cada 50k registros
			let lastProgressLog = 0;
			
			// Inicializar estado de carga
			this.loadingStatus = {
				isLoading: true,
				loaded: 0,
				totalBytes: 0,
				bytesMB: 0,
				rate: 0
			};
			
			console.log(
				`[INFO] Iniciando carga de datos desde: ${PARQUET_PATH} (límite ${MAX_CHUNK_SIZE} bytes)`
			);
			if (DATA_CACHE_ROW_LIMIT !== null) {
				console.log(`[INFO] Aplicando límite de ${DATA_CACHE_ROW_LIMIT} registros en Python`);
			}
			if (SELECT_COLUMNS_ENABLED) {
				console.log(`[INFO] Seleccionando ${EXPORT_COLUMNS.length} columnas relevantes en Python`);
			}

			const rowLimitLiteral = DATA_CACHE_ROW_LIMIT !== null ? DATA_CACHE_ROW_LIMIT.toString() : 'None';
			const columnsLiteral = SELECT_COLUMNS_ENABLED ? JSON.stringify(EXPORT_COLUMNS) : 'None';

			const pythonScript = `
import polars as pl
import json
import sys

ROW_LIMIT = ${rowLimitLiteral}
COLUMNS = ${columnsLiteral}

try:
    df = pl.read_parquet("${PARQUET_PATH}")
    if ROW_LIMIT:
        df = df.head(ROW_LIMIT)
    if COLUMNS:
        df = df.select(COLUMNS)
    # Convertir a JSON línea por línea para streaming eficiente
    records = df.to_dicts()
    for record in records:
        print(json.dumps(record), flush=True)
    print("${END_OF_STREAM_MARKER}", flush=True)
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr, flush=True)
    sys.exit(1)
`;

			const python = spawn(PYTHON_EXECUTABLE, ['-c', pythonScript]);
			const records: ExportRecord[] = [];
			let totalBytes = 0;
			let parseErrors = 0;
			let stderr = '';
			let timeoutId: NodeJS.Timeout | null = null;
			let partialLine = '';
			let syntheticLimitTriggered = false;

			// Configurar timeout
			timeoutId = setTimeout(() => {
				python.kill();
				const error = new Error(`Timeout: El proceso de Python excedió ${PYTHON_TIMEOUT}ms`);
				console.error('[ERROR]', error.message);
				reject(error);
			}, PYTHON_TIMEOUT);

			const handleParseError = (line: string) => {
				parseErrors++;
				if (parseErrors <= 5) {
					console.warn('[WARN] Failed to parse line:', line.substring(0, 100));
				}
			};

			python.stdout.on('data', (data: Buffer) => {
				totalBytes += data.length;

				if (totalBytes > MAX_CHUNK_SIZE) {
					if (timeoutId) clearTimeout(timeoutId);
					python.kill();
					syntheticLimitTriggered = true;
					const error = new Error(this.buildLimitMessage(totalBytes));
					console.error('[ERROR]', error.message);
					reject(error);
					return;
				}

				partialLine += data.toString('utf-8');

				let newlineIndex = partialLine.indexOf('\n');
				while (newlineIndex >= 0) {
					const line = partialLine.slice(0, newlineIndex).trim();
					partialLine = partialLine.slice(newlineIndex + 1);
					this.processLine(line, records, handleParseError);
					
					// Actualizar estado de carga
					const elapsed = Date.now() - startTime;
					const bytesMB = totalBytes / (1024 * 1024);
					const rate = elapsed > 0 ? records.length / (elapsed / 1000) : 0;
					
					// Estimar total basado en velocidad (proyección de 10 segundos)
					const estimatedTotal = rate > 0 ? Math.max(records.length, Math.floor(rate * 10)) : undefined;
					const percentage = estimatedTotal && rate > 0
						? Math.min(95, (records.length / estimatedTotal) * 100)
						: undefined;
					
					this.loadingStatus = {
						isLoading: true,
						loaded: records.length,
						totalBytes: totalBytes,
						bytesMB: bytesMB,
						rate: rate,
						estimatedTotal: estimatedTotal,
						percentage: percentage
					};
					
					// Mostrar progreso cada PROGRESS_INTERVAL registros
					if (records.length - lastProgressLog >= PROGRESS_INTERVAL) {
						const rateFormatted = rate.toFixed(0);
						console.log(
							`[PROGRESO] ${records.length.toLocaleString()} registros cargados (${bytesMB.toFixed(2)} MB) | ${rateFormatted} reg/s`
						);
						lastProgressLog = records.length;
					}
					
					newlineIndex = partialLine.indexOf('\n');
				}
			});

			python.stderr.on('data', (data: Buffer) => {
				stderr += data.toString();
			});

			python.on('close', (code) => {
				if (timeoutId) clearTimeout(timeoutId);

				// Procesar cualquier línea pendiente
				if (partialLine.trim()) {
					this.processLine(partialLine.trim(), records, handleParseError);
				}

				if (code !== 0 && !syntheticLimitTriggered) {
					const error = new Error(`Python script failed with code ${code}: ${stderr}`);
					console.error('[ERROR] Python script failed:', stderr);
					reject(error);
					return;
				}

				try {
					if (parseErrors > 0) {
						console.warn(`[WARN] Total de errores de parseo: ${parseErrors}`);
					}

					const duration = Date.now() - startTime;
					const durationSeconds = (duration / 1000).toFixed(2);
					const bytesMB = (totalBytes / (1024 * 1024)).toFixed(2);
					const rate = (records.length / (duration / 1000)).toFixed(0);
					
					// Actualizar estado final
					this.loadingStatus = {
						isLoading: false,
						loaded: records.length,
						totalBytes: totalBytes,
						bytesMB: parseFloat(bytesMB),
						rate: parseFloat(rate),
						percentage: 100
					};
					
					console.log(
						`[INFO] ✅ Carga completada: ${records.length.toLocaleString()} registros en ${durationSeconds}s (${bytesMB} MB) | ${rate} reg/s`
					);

					if (records.length === 0) {
						const error = new Error('No se encontraron registros válidos en el archivo Parquet');
						console.error('[ERROR]', error.message);
						reject(error);
						return;
					}

					resolve(records);
				} catch (parseError) {
					const error = new Error(`Failed to parse data: ${String(parseError)}`);
					console.error('[ERROR] Failed to parse JSON:', parseError);
					reject(error);
				}
			});

			python.on('error', (error) => {
				if (timeoutId) clearTimeout(timeoutId);
				console.error('[ERROR] Failed to spawn Python:', error);
				reject(new Error(`Python not available: ${String(error)}`));
			});
		});
	}

	/**
	 * Transforma un registro del formato Python al formato ExportRecord
	 * Incluye validación de tipos y valores
	 */
	private transformRecord(record: RawExportRecord | null | undefined): ExportRecord {
		// Validar que el registro tenga la estructura esperada
		if (!record || typeof record !== 'object') {
			throw new Error('Registro inválido: no es un objeto');
		}

		// Transformar con validación de tipos
		const transformed: ExportRecord = {
			season: String(record.season || ''),
			year: Number(record.year || 0),
			week: Number(record.week || 0),
			absolute_season_week: Number(record.absolute_season_week || 0),
			region: String(record.region || ''),
			market: String(record.market || ''),
			country: String(record.country || ''),
			transport: String(record.transport || ''),
			product: String(record.product || ''),
			variety: String(record.variety || ''),
			importer: String(record.importer || ''),
			exporter: String(record.exporter || ''),
			port_destination: String(record.port_destination || ''),
			boxes: Number(record.boxes || 0),
			net_weight_kg: Number(record.net_weight_kg || 0),
			unit_weight_kg: Number(record.unit_weight_kg || 0),
			is_outlier: Boolean(record.is_data_outlier || record.is_outlier || false)
		};

		// Validar valores numéricos
		if (isNaN(transformed.year)) transformed.year = 0;
		if (isNaN(transformed.week)) transformed.week = 0;
		if (isNaN(transformed.absolute_season_week)) transformed.absolute_season_week = 0;
		if (isNaN(transformed.boxes)) transformed.boxes = 0;
		if (isNaN(transformed.net_weight_kg)) transformed.net_weight_kg = 0;
		if (isNaN(transformed.unit_weight_kg ?? 0)) transformed.unit_weight_kg = 0;

		return transformed;
	}

	/**
	 * Procesa una línea NDJSON emitida por el script de Python
	 */
	private processLine(line: string, records: ExportRecord[], onParseError: (line: string) => void): void {
		if (!line || line === END_OF_STREAM_MARKER) {
			return;
		}

		try {
			const record = JSON.parse(line);
			const transformed = this.transformRecord(record);
			records.push(transformed);
		} catch {
			onParseError(line);
		}
	}

	/**
	 * Mensaje amigable cuando se supera el límite de bytes configurado
	 */
	private buildLimitMessage(totalBytes: number): string {
		const bytesMB = (totalBytes / (1024 * 1024)).toFixed(2);
		const limitMB = (MAX_CHUNK_SIZE / (1024 * 1024)).toFixed(2);
		return (
			`Datos demasiado grandes: ${bytesMB}MB supera el límite configurado de ${limitMB}MB. ` +
			'Ajusta la variable DATA_CACHE_MAX_CHUNK_BYTES o reduce el tamaño del dataset (por ejemplo, regenerando el Parquet o habilitando paginación en origen).'
		);
	}

	/**
	 * Obtiene los datos del caché, cargándolos si es necesario
	 */
	async getData(): Promise<ExportRecord[]> {
		// Si ya hay datos en caché, retornarlos
		if (this.data !== null) {
			return this.data;
		}

		// Si hay un error previo, rechazar inmediatamente
		if (this.lastError) {
			console.warn('[WARN] Reutilizando error previo, intentando recargar...');
			// Permitir reintento después de un error
			this.lastError = null;
		}

		// Si ya hay una carga en progreso, esperar a que termine
		if (this.loadingPromise) {
			console.log('[INFO] Carga en progreso, esperando...');
			return this.loadingPromise;
		}

		// Iniciar nueva carga
		console.log('[INFO] Iniciando carga de datos...');
		this.loadingPromise = this.loadData()
			.then((data) => {
				this.data = data;
				this.loadingPromise = null;
				this.lastError = null;
				console.log(`[INFO] Caché inicializado con ${data.length} registros`);
				return data;
			})
			.catch((error) => {
				this.lastError = error;
				this.loadingPromise = null;
				console.error('[ERROR] Error al cargar datos:', error);
				throw error;
			});

		return this.loadingPromise;
	}

	/**
	 * Invalida el caché, forzando una recarga en el próximo request
	 */
	invalidate(): void {
		this.data = null;
		this.lastError = null;
		this.loadingPromise = null;
		this.loadingStatus = {
			isLoading: false,
			loaded: 0,
			totalBytes: 0,
			bytesMB: 0,
			rate: 0
		};
	}

	/**
	 * Verifica si los datos están cargados
	 */
	isLoaded(): boolean {
		return this.data !== null;
	}

	/**
	 * Obtiene el estado actual de carga
	 */
	getLoadingStatus(): LoadingStatus {
		return { ...this.loadingStatus };
	}
}

export type { LoadingStatus };

// Singleton instance
export const dataCache = new DataCache();

