"""
Script de combinación de archivos Parquet en dataset maestro.

Este script carga todos los Parquets normalizados de data_clean/,
los combina en un único dataset y guarda el resultado en data/exports_10_years.parquet.
"""

import polars as pl
from pathlib import Path
from tqdm import tqdm
from typing import List, Optional, Tuple


def extract_week_number(filename: str) -> Optional[int]:
	"""
	Extraer número de semana del nombre del archivo.
	
	Formato esperado: "datos_semana_XX.parquet" donde XX es el número de semana.
	
	Args:
		filename: Nombre del archivo
	
	Returns:
		Número de semana o None si no se puede extraer
	"""
	import re
	match = re.search(r'datos_semana_(\d+)', filename)
	if match:
		try:
			return int(match.group(1))
		except ValueError:
			return None
	return None


def load_parquet_files(data_clean_dir: Path) -> List[tuple[pl.LazyFrame, int]]:
	"""
	Cargar todos los archivos Parquet de data_clean/ como LazyFrames.
	
	Args:
		data_clean_dir: Directorio con Parquets normalizados
	
	Returns:
		Lista de tuplas (LazyFrame, week_number), uno por cada Parquet
	"""
	print(f"Cargando Parquets de: {data_clean_dir}")
	
	# Escanear directorio y encontrar todos los .parquet
	parquet_files = sorted(data_clean_dir.glob("*.parquet"))
	
	if not parquet_files:
		print("No se encontraron archivos Parquet")
		return []
	
	print(f"Encontrados {len(parquet_files)} archivos Parquet")
	
	# Cargar cada Parquet con pl.scan_parquet() en modo lazy
	lazy_frames_with_week = []
	for parquet_file in tqdm(parquet_files, desc="Cargando Parquets"):
		try:
			lazy_frame = pl.scan_parquet(parquet_file)
			week_number = extract_week_number(parquet_file.name)
			if week_number is not None:
				# Agregar columna source_week a cada LazyFrame
				lazy_frame = lazy_frame.with_columns(
					pl.lit(week_number).alias("source_week")
				)
				lazy_frames_with_week.append((lazy_frame, week_number))
			else:
				# Si no se puede extraer, usar -1 como marcador
				lazy_frame = lazy_frame.with_columns(
					pl.lit(-1).alias("source_week")
				)
				lazy_frames_with_week.append((lazy_frame, -1))
		except Exception as e:
			print(f"  ⚠️  Error cargando {parquet_file.name}: {e}")
			continue
	
	return lazy_frames_with_week


def combine_datasets(lazy_frames_with_week: List[Tuple[pl.LazyFrame, int]]) -> pl.LazyFrame:
	"""
	Combinar múltiples LazyFrames en un único dataset.

	Args:
		lazy_frames_with_week: Lista de tuplas (LazyFrame, week_number) a combinar

	Returns:
		LazyFrame combinado con todos los datos
	"""
	if not lazy_frames_with_week:
		raise ValueError("No hay LazyFrames para combinar")
	
	# Extraer solo los LazyFrames
	lazy_frames = [lf for lf, _ in lazy_frames_with_week]
	
	print(f"Combinando {len(lazy_frames)} datasets...")
	
	# Verificar que todos tengan el mismo esquema (usar el primero como referencia)
	reference_schema = lazy_frames[0].collect_schema()
	for i, (lf, week_num) in enumerate(lazy_frames_with_week[1:], 1):
		lf_schema = lf.collect_schema()
		# Comparar esquemas sin source_week (que acabamos de agregar)
		ref_schema_no_source = {k: v for k, v in reference_schema.items() if k != "source_week"}
		lf_schema_no_source = {k: v for k, v in lf_schema.items() if k != "source_week"}
		if ref_schema_no_source != lf_schema_no_source:
			print(f"  ⚠️  Advertencia: LazyFrame {i} (semana {week_num}) tiene esquema diferente")
	
	# Usar pl.concat() para combinar LazyFrames
	combined_df = pl.concat(lazy_frames)
	
	# Ordenar por año y semana para consistencia
	if "year" in reference_schema and "week" in reference_schema:
		combined_df = combined_df.sort(["year", "week", "source_week"])
	
	return combined_df


def enforce_final_schema(df: pl.LazyFrame) -> pl.LazyFrame:
	"""
	Enforzar el schema final del dataset.

	Args:
		df: LazyFrame a normalizar

	Returns:
		LazyFrame con schema final aplicado
	"""
	# Schema final esperado (incluyendo source_week para referencia)
	final_columns = [
		"season",
		"week",
		"year",
		"region",
		"market",
		"country",
		"transport",
		"product",
		"variety",
		"importer",
		"exporter",
		"port_destination",
		"boxes",
		"net_weight_kg",
		"source_week"  # Agregar source_week para referencia
	]
	
	# Seleccionar solo las columnas del schema final en el orden correcto
	# Si alguna columna no existe, se omitirá (pero deberían existir todas)
	df_schema = df.collect_schema()
	existing_columns = [col for col in final_columns if col in df_schema.names()]
	
	# Verificar columnas requeridas (sin source_week)
	required_columns = [
		"season", "week", "year", "country", "product", 
		"exporter", "boxes", "net_weight_kg"
	]
	missing_required = set(required_columns) - set(existing_columns)
	if missing_required:
		print(f"  ⚠️  Advertencia: Columnas faltantes: {missing_required}")
	
	# Seleccionar columnas en el orden correcto
	df = df.select(existing_columns)
	
	# Forzar tipos de datos
	type_mapping = {
		"season": pl.Utf8,
		"week": pl.Int64,
		"year": pl.Int64,
		"region": pl.Utf8,
		"market": pl.Utf8,
		"country": pl.Utf8,
		"transport": pl.Utf8,
		"product": pl.Utf8,
		"variety": pl.Utf8,
		"importer": pl.Utf8,
		"exporter": pl.Utf8,
		"port_destination": pl.Utf8,
		"boxes": pl.Int64,
		"net_weight_kg": pl.Float64,
		"source_week": pl.Int64  # Tipo para source_week
	}
	
	# Aplicar casts solo a columnas que existen
	for col, dtype in type_mapping.items():
		if col in existing_columns:
			df = df.with_columns(pl.col(col).cast(dtype, strict=False))
	
	return df


def save_master_dataset(df: pl.LazyFrame, output_path: Path) -> None:
	"""
	Guardar dataset maestro consolidado como Parquet.

	Args:
		df: LazyFrame con todos los datos combinados
		output_path: Path donde guardar el dataset final
	"""
	output_path.parent.mkdir(parents=True, exist_ok=True)
	
	print(f"Guardando dataset maestro: {output_path}")
	
	# Enforzar schema final antes de guardar
	df = enforce_final_schema(df)
	
	# Ejecutar lazy frame (collect())
	print("Ejecutando operaciones lazy y cargando en memoria...")
	df_eager = df.collect()
	
	# Guardar con pl.write_parquet() usando compresión snappy
	print("Guardando archivo Parquet...")
	df_eager.write_parquet(
		output_path,
		compression="snappy",
		use_pyarrow=True
	)
	
	# Mostrar estadísticas del dataset
	total_rows = len(df_eager)
	total_boxes = df_eager["boxes"].sum() if "boxes" in df_eager.columns else 0
	total_kilos = df_eager["net_weight_kg"].sum() if "net_weight_kg" in df_eager.columns else 0.0
	file_size = output_path.stat().st_size / (1024 * 1024)  # MB
	
	print(f"\n{'='*60}")
	print("ESTADÍSTICAS DEL DATASET MAESTRO")
	print(f"{'='*60}")
	print(f"Total de filas:     {total_rows:,.0f}")
	print(f"Total de boxes:     {total_boxes:,.0f}")
	print(f"Total de kilos:     {total_kilos:,.2f}")
	print(f"Tamaño del archivo: {file_size:,.2f} MB")
	print(f"{'='*60}")
	
	print(f"\n✓ Dataset guardado exitosamente: {output_path}")


def main():
	"""Función principal del script de combinación."""
	data_clean_dir = Path(__file__).parent.parent / "data_clean"
	data_dir = Path(__file__).parent.parent / "data"
	output_path = data_dir / "exports_10_years.parquet"
	
	if not data_clean_dir.exists():
		print(f"Error: Directorio {data_clean_dir} no existe")
		print("Ejecuta primero scripts/normalize.py")
		return
	
	print("="*60)
	print("COMBINACIÓN DE DATASETS")
	print("="*60)
	print("\nEste script combina todos los Parquets normalizados")
	print("en un único dataset maestro.\n")
	print(f"Directorio origen: {data_clean_dir}")
	print(f"Archivo destino: {output_path}")
	print("\nPara combinar: python scripts/combine.py\n")
	
	# Cargar todos los Parquets
	lazy_frames_with_week = load_parquet_files(data_clean_dir)
	
	if not lazy_frames_with_week:
		print("No se encontraron archivos Parquet en data_clean/")
		return
	
	# Combinar datasets
	combined_df = combine_datasets(lazy_frames_with_week)
	
	# Guardar dataset maestro
	save_master_dataset(combined_df, output_path)
	
	print("\n✓ Combinación completada.")


if __name__ == "__main__":
	main()

