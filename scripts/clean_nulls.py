"""
Script de limpieza de valores nulos del dataset maestro.

Este script rellena valores nulos con "SN" (Sin Nombre):
- Para columnas de tipo string: rellena con "SN"
- Mantiene duplicados (no los elimina)
- Lo importante es mantener el total de cajas y kilos correcto
"""

import polars as pl
from pathlib import Path
from typing import Dict, List
from tqdm import tqdm


def clean_nulls_with_sn(
	df: pl.DataFrame,
	columns_to_clean: List[str] = None
) -> pl.DataFrame:
	"""
	Limpiar valores nulos rellenando con "SN" (Sin Nombre).

	Args:
		df: DataFrame con nulos
		columns_to_clean: Lista de columnas a limpiar. Si None, limpia todas las columnas string.

	Returns:
		DataFrame sin nulos (rellenados con "SN")
	"""
	print("Limpiando valores nulos rellenando con 'SN'...")
	
	# Si no se especifican columnas, identificar todas las columnas con nulos (excepto source_week)
	if columns_to_clean is None:
		columns_to_clean = [col for col in df.columns if col != "source_week" and df[col].null_count() > 0]
	
	# Filtrar solo columnas que existen en el DataFrame
	columns_to_clean = [col for col in columns_to_clean if col in df.columns]
	
	# Contar nulos antes de limpiar
	nulls_before = {}
	for col in columns_to_clean:
		null_count = df[col].null_count()
		if null_count > 0:
			nulls_before[col] = null_count
	
	if nulls_before:
		print(f"\nNulos encontrados antes de limpieza:")
		for col, count in nulls_before.items():
			print(f"  {col}: {count:,} nulos")
	else:
		print("\n✓ No hay nulos. El dataset ya está limpio.")
		return df
	
	# Separar columnas por tipo
	string_columns = [col for col in columns_to_clean if df[col].dtype == pl.Utf8]
	numeric_columns = [col for col in columns_to_clean if df[col].dtype in [pl.Int64, pl.Float64]]
	
	# Rellenar nulos: "SN" para strings, 0 para numéricos
	print("\nRellenando nulos:")
	if string_columns:
		print(f"  Columnas string: rellenando con 'SN' ({len(string_columns)} columnas)")
	if numeric_columns:
		print(f"  Columnas numéricas: rellenando con 0 ({len(numeric_columns)} columnas)")
	
	df_cleaned = df.with_columns([
		# Strings: rellenar con "SN"
		pl.col(col).fill_null("SN") if col in string_columns else
		# Numéricas: rellenar con 0
		pl.col(col).fill_null(0) if col in numeric_columns else
		# Otras: mantener como están
		pl.col(col)
		for col in df.columns
	])
	
	# Contar nulos finales
	nulls_after = {}
	for col in columns_to_clean:
		null_count = df_cleaned[col].null_count()
		if null_count > 0:
			nulls_after[col] = null_count
	
	if nulls_after:
		print(f"\n⚠️  Nulos restantes después de limpieza:")
		for col, count in nulls_after.items():
			print(f"  {col}: {count:,} nulos")
	else:
		print("\n✓ Todos los nulos fueron rellenados (strings con 'SN', numéricas con 0)")
	
	# Resumen
	print("\n" + "="*60)
	print("RESUMEN DE LIMPIEZA")
	print("="*60)
	for col in columns_to_clean:
		before = nulls_before.get(col, 0)
		after = nulls_after.get(col, 0)
		if before > 0:
			cleaned = before - after
			pct = (cleaned / before * 100) if before > 0 else 0
			print(f"{col}:")
			print(f"  Antes: {before:,} nulos")
			fill_value = "SN" if col in string_columns else "0"
			print(f"  Rellenados con '{fill_value}': {cleaned:,} ({pct:.1f}%)")
			print(f"  Restantes: {after:,} nulos")
	
	return df_cleaned


def main():
	"""Función principal del script de limpieza."""
	data_dir = Path(__file__).parent.parent / "data"
	parquet_path = data_dir / "exports_10_years.parquet"
	output_path = data_dir / "exports_10_years_clean.parquet"
	
	print("="*60)
	print("LIMPIEZA DE VALORES NULOS")
	print("="*60)
	print("\nEste script limpia valores nulos rellenando con 'SN' (Sin Nombre).")
	print("Mantiene duplicados. Lo importante es mantener totales de cajas y kilos correctos.")
	print(f"Dataset origen: {parquet_path}")
	print(f"Dataset destino: {output_path}")
	print("\nPara limpiar: python scripts/clean_nulls.py\n")
	
	if not parquet_path.exists():
		print(f"Error: Archivo {parquet_path} no existe")
		print("Ejecuta primero scripts/combine.py")
		return
	
	# Cargar dataset maestro
	print("Cargando dataset maestro...")
	df = pl.read_parquet(parquet_path)
	
	print(f"Dataset cargado: {len(df):,} filas, {len(df.columns)} columnas")
	
	# Identificar columnas con nulos (excluyendo source_week que es metadato)
	columns_with_nulls = []
	for col in df.columns:
		if col != "source_week" and df[col].null_count() > 0:
			columns_with_nulls.append(col)
	
	if not columns_with_nulls:
		print("\n✓ No hay columnas con nulos. El dataset ya está limpio.")
		return
	
	print(f"\nColumnas con nulos encontradas: {len(columns_with_nulls)}")
	for col in columns_with_nulls:
		null_count = df[col].null_count()
		print(f"  {col}: {null_count:,} nulos")
	
	# Limpiar nulos (solo columnas string, rellenar con "SN")
	df_cleaned = clean_nulls_with_sn(df, columns_with_nulls)
	
	# Guardar dataset limpio
	print(f"\nGuardando dataset limpio: {output_path}")
	df_cleaned.write_parquet(
		output_path,
		compression="snappy",
		use_pyarrow=True
	)
	
	# Estadísticas finales
	print("\n" + "="*60)
	print("ESTADÍSTICAS FINALES")
	print("="*60)
	print(f"Filas originales: {len(df):,}")
	print(f"Filas después de limpieza: {len(df_cleaned):,}")
	print(f"Tamaño del archivo: {output_path.stat().st_size / (1024*1024):.2f} MB")
	
	print(f"\n✓ Dataset limpio guardado: {output_path}")
	print("\n✓ Limpieza completada.")


if __name__ == "__main__":
	main()


