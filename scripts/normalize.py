"""
Script de normalización de archivos CSV al esquema maestro.

Este script carga cada CSV semanal, lo normaliza al esquema maestro
y guarda el resultado como Parquet en data_clean/.
"""

import polars as pl
import json
import re
from pathlib import Path
from typing import Optional, Dict, Any
from tqdm import tqdm


def load_schema_master(scripts_dir: Path) -> Dict[str, Any]:
	"""
	Cargar schema_master.json.

	Args:
		scripts_dir: Directorio donde está schema_master.json

	Returns:
		Dict con schema maestro y mapeo de columnas
	"""
	schema_path = scripts_dir / "schema_master.json"
	
	if not schema_path.exists():
		raise FileNotFoundError(
			"schema_master.json no encontrado. Ejecuta primero scripts/inventory.py y scripts/generate_schema.py"
		)
	
	with open(schema_path, 'r', encoding='utf-8') as f:
		schema_master = json.load(f)
	
	return schema_master


def detect_csv_encoding_and_separator(csv_path: Path) -> tuple[str, str]:
	"""
	Detectar encoding y separador de un archivo CSV.

	Args:
		csv_path: Path al archivo CSV

	Returns:
		Tupla (encoding, separator)
	"""
	encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
	separators = [',', ';', '\t']
	
	for encoding in encodings:
		try:
			with open(csv_path, 'r', encoding=encoding) as f:
				first_line = f.readline()
				for sep in separators:
					if sep in first_line:
						return encoding, sep
		except (UnicodeDecodeError, Exception):
			continue
	
	# Defaults
	return 'utf-8', ','


def load_csv(csv_path: Path) -> Optional[pl.DataFrame]:
	"""
	Cargar archivo CSV con Polars.
	
	IMPORTANTE: Lee las columnas numéricas como string primero para preservar
	los separadores de miles (puntos) que Polars interpretaría como decimales.

	Args:
		csv_path: Path al archivo CSV

	Returns:
		DataFrame de Polars, o None si hay error
	"""
	try:
		encoding, separator = detect_csv_encoding_and_separator(csv_path)
		
		# Leer CSV sin inferir schema automáticamente (todo como string)
		# Esto preserva los separadores de miles que Polars interpretaría como decimales
		df = pl.read_csv(
			csv_path,
			encoding=encoding,
			separator=separator,
			ignore_errors=True,
			try_parse_dates=False,
			infer_schema_length=0  # No inferir schema, leer todo como string
		)
		
		return df
	except Exception as e:
		print(f"  ⚠️  Error cargando {csv_path.name}: {e}")
		return None


def normalize_schema(df: pl.DataFrame, schema_master: Dict[str, Any], csv_path: Path) -> pl.DataFrame:
	"""
	Normalizar DataFrame al esquema maestro (pipeline completo).

	Args:
		df: DataFrame original
		schema_master: Schema maestro completo
		csv_path: Path al CSV original

	Returns:
		DataFrame normalizado
	"""
	schema = schema_master.get("schema", {})
	
	# 1. Mapear columnas básicas
	rename_dict = {
		"Season": "season",
		"Region": "region",
		"Market": "market",
		"Country": "country",
		"Transport": "transport",
		"Specie": "product",
		"Variety": "variety",
		"Importer": "importer",
		"Exporter": "exporter",
		"Arrival port": "port_destination",
		"Boxes": "boxes",
		"Kilograms": "net_weight_kg"
	}
	
	for old_name, new_name in rename_dict.items():
		if old_name in df.columns:
			df = df.rename({old_name: new_name})
	
	# 2. Extraer week y year de "ETD Week"
	if "ETD Week" in df.columns:
		# Convertir a string y dividir por "-"
		df = df.with_columns([
			pl.col("ETD Week").cast(pl.Utf8).str.split("-").list.get(0).cast(pl.Int64, strict=False).alias("week"),
			pl.col("ETD Week").cast(pl.Utf8).str.split("-").list.get(1).cast(pl.Int64, strict=False).alias("year")
		])
		
		# Verificar si hay valores nulos y advertir
		null_weeks = df["week"].null_count()
		null_years = df["year"].null_count()
		if null_weeks > 0 or null_years > 0:
			print(f"  ⚠️  {csv_path.name}: {null_weeks} semanas y {null_years} años no pudieron extraerse de ETD Week")
	
	# 3. Normalizar season (mantener como string, solo strip)
	if "season" in df.columns:
		df = df.with_columns(
			pl.col("season").str.strip_chars().alias("season")
		)
	
	# 4. Normalizar country (upper case)
	if "country" in df.columns:
		df = df.with_columns(
			pl.col("country").str.strip_chars().str.to_uppercase().alias("country")
		)
	
	# 5. Normalizar product (Specie → strip + title case)
	if "product" in df.columns:
		df = df.with_columns(
			pl.col("product").str.strip_chars().str.to_titlecase().alias("product")
		)
	
	# 6. Normalizar exporter (strip + title case)
	if "exporter" in df.columns:
		df = df.with_columns(
			pl.col("exporter").str.strip_chars().str.to_titlecase().alias("exporter")
		)
	
	# 7. Normalizar region (strip + title case)
	if "region" in df.columns:
		df = df.with_columns(
			pl.col("region").str.strip_chars().str.to_titlecase().alias("region")
		)
	
	# 8. Normalizar market (strip + title case)
	if "market" in df.columns:
		df = df.with_columns(
			pl.col("market").str.strip_chars().str.to_titlecase().alias("market")
		)
	
	# 9. Normalizar transport (strip + title case)
	if "transport" in df.columns:
		df = df.with_columns(
			pl.col("transport").str.strip_chars().str.to_titlecase().alias("transport")
		)
	
	# 10. Normalizar variety (strip + title case)
	if "variety" in df.columns:
		df = df.with_columns(
			pl.col("variety").str.strip_chars().str.to_titlecase().alias("variety")
		)
	
	# 11. Normalizar importer (strip + title case)
	if "importer" in df.columns:
		df = df.with_columns(
			pl.col("importer").str.strip_chars().str.to_titlecase().alias("importer")
		)
	
	# 12. Normalizar port_destination (strip + title case)
	if "port_destination" in df.columns:
		df = df.with_columns(
			pl.col("port_destination").str.strip_chars().str.to_titlecase().alias("port_destination")
		)
	
	# 13. Normalizar boxes (remover separadores "." y convertir a int)
	if "boxes" in df.columns:
		df = df.with_columns(
			pl.col("boxes")
			.cast(pl.Utf8)
			.str.replace_all(r'\.', '')  # Remover todos los puntos
			.str.strip_chars()
			.cast(pl.Int64, strict=False)
			.alias("boxes")
		)
	
	# 14. Normalizar net_weight_kg (remover TODOS los "." y convertir a float)
	# Los puntos NO son decimales, son separadores de miles
	if "net_weight_kg" in df.columns:
		df = df.with_columns(
			pl.col("net_weight_kg")
			.cast(pl.Utf8)
			.str.replace_all(r'\.', '')  # Remover TODOS los puntos
			.str.strip_chars()
			.cast(pl.Float64, strict=False)
			.alias("net_weight_kg")
		)
	
	# 15. Seleccionar solo las columnas del schema final en el orden correcto
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
		"net_weight_kg"
	]
	
	# Solo incluir columnas que existen
	existing_columns = [col for col in final_columns if col in df.columns]
	df = df.select(existing_columns)
	
	return df


def save_parquet(df: pl.DataFrame, csv_path: Path, output_dir: Path) -> Path:
	"""
	Guardar DataFrame normalizado como Parquet.

	Args:
		df: DataFrame normalizado
		csv_path: Path al CSV original (para generar nombre del Parquet)
		output_dir: Directorio de salida

	Returns:
		Path al archivo Parquet creado
	"""
	output_dir.mkdir(parents=True, exist_ok=True)
	
	# Generar nombre del archivo Parquet
	parquet_name = csv_path.stem + ".parquet"
	output_path = output_dir / parquet_name
	
	# Guardar con compresión
	df.write_parquet(
		output_path,
		compression="snappy",
		use_pyarrow=True
	)
	
	return output_path


def process_weekly_file(
	csv_path: Path,
	output_dir: Path,
	schema_master: Dict[str, Any]
) -> Optional[Path]:
	"""
	Procesar un archivo CSV semanal completo: cargar, normalizar y guardar.

	Args:
		csv_path: Path al archivo CSV a procesar
		output_dir: Directorio donde guardar el Parquet normalizado
		schema_master: Schema maestro

	Returns:
		Path al archivo Parquet creado, o None si hubo error
	"""
	try:
		# Cargar CSV
		df = load_csv(csv_path)
		if df is None:
			return None
		
		# Normalizar esquema
		df_normalized = normalize_schema(df, schema_master, csv_path)
		
		# Guardar Parquet
		output_path = save_parquet(df_normalized, csv_path, output_dir)
		
		return output_path
	except Exception as e:
		print(f"  ⚠️  Error procesando {csv_path.name}: {e}")
		return None


def main():
	"""Función principal del script de normalización."""
	data_raw_dir = Path(__file__).parent.parent / "data_raw"
	data_clean_dir = Path(__file__).parent.parent / "data_clean"
	scripts_dir = Path(__file__).parent
	
	if not data_raw_dir.exists():
		print(f"Error: Directorio {data_raw_dir} no existe")
		return
	
	# Cargar schema maestro
	try:
		schema_master = load_schema_master(scripts_dir)
	except FileNotFoundError as e:
		print(f"Error: {e}")
		return
	
	print("="*60)
	print("NORMALIZACIÓN CORREGIDA - REGENERANDO PARQUETS")
	print("="*60)
	print("\nCorrecciones aplicadas:")
	print("  ✓ Extracción de week y year desde 'ETD Week' (formato: week-year)")
	print("  ✓ Removidos hs_code y value_usd del schema")
	print("  ✓ Agregado boxes (int, removiendo separadores '.')")
	print("  ✓ Corregido net_weight_kg (removiendo TODOS los '.' como separadores)")
	print("  ✓ Normalización de product (Specie → strip + title)")
	print("  ✓ Normalización de country (upper case)")
	print("  ✓ Normalización de exporter y port_destination (title case)")
	print("\n" + "="*60)
	print(f"Directorio origen: {data_raw_dir}")
	print(f"Directorio destino: {data_clean_dir}")
	
	# Obtener lista de CSVs
	csv_files = sorted(data_raw_dir.glob("*.csv"))
	
	if not csv_files:
		print("No se encontraron archivos CSV en data_raw/")
		return
	
	print(f"\nProcesando {len(csv_files)} archivos CSV...")
	print("(Los archivos Parquet existentes serán sobrescritos)\n")
	
	# Procesar cada archivo
	successful = 0
	failed = 0
	warnings = 0
	
	for csv_file in tqdm(csv_files, desc="Normalizando"):
		result = process_weekly_file(csv_file, data_clean_dir, schema_master)
		if result:
			successful += 1
		else:
			failed += 1
	
	print(f"\n" + "="*60)
	print("✓ NORMALIZACIÓN COMPLETADA")
	print("="*60)
	print(f"  - Exitosos: {successful}")
	print(f"  - Fallidos: {failed}")
	print(f"  - Total: {len(csv_files)}")
	print(f"\nSchema final aplicado:")
	print("  season, week, year, country, product, exporter,")
	print("  port_destination, boxes, net_weight_kg")
	print("="*60)


if __name__ == "__main__":
	main()
