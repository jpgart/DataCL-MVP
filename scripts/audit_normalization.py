"""
Script de auditoría de normalización.

Este script compara los datos CSV originales con los Parquets normalizados,
calculando sumas de boxes y kilos para detectar discrepancias en la normalización.
"""

import polars as pl
from pathlib import Path
from typing import Dict, Any, Optional, List
from tqdm import tqdm


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


def load_csv_totals(csv_path: Path) -> Optional[Dict[str, Any]]:
	"""
	Cargar CSV y calcular totales de boxes y kilos.

	Args:
		csv_path: Path al archivo CSV

	Returns:
		Dict con totales calculados o None si hay error
	"""
	try:
		encoding, separator = detect_csv_encoding_and_separator(csv_path)
		
		# Cargar CSV sin inferir schema automáticamente (todo como string)
		# Esto preserva los separadores de miles que Polars interpretaría como decimales
		df = pl.read_csv(
			csv_path,
			encoding=encoding,
			separator=separator,
			ignore_errors=True,
			try_parse_dates=False,
			infer_schema_length=0  # No inferir schema, leer todo como string
		)
		
		# Verificar que existan las columnas necesarias
		if "Boxes" not in df.columns or "Kilograms" not in df.columns:
			return None
		
		# Remover separadores de miles "." y convertir a numérico
		# Boxes: remover "." y convertir a int
		boxes_series = (
			pl.col("Boxes")
			.cast(pl.Utf8)
			.str.replace_all(r'\.', '')  # Remover todos los puntos
			.str.strip_chars()
			.cast(pl.Int64, strict=False)
		)
		
		# Kilograms: remover "." y convertir a float
		kilos_series = (
			pl.col("Kilograms")
			.cast(pl.Utf8)
			.str.replace_all(r'\.', '')  # Remover todos los puntos
			.str.strip_chars()
			.cast(pl.Float64, strict=False)
		)
		
		df_processed = df.with_columns([
			boxes_series.alias("boxes_clean"),
			kilos_series.alias("kilos_clean")
		])
		
		# Calcular sumas
		boxes_sum = df_processed["boxes_clean"].sum()
		kilos_sum = df_processed["kilos_clean"].sum()
		rows_count = len(df_processed)
		
		return {
			"boxes_csv_sum": boxes_sum if boxes_sum is not None else 0,
			"kilos_csv_sum": kilos_sum if kilos_sum is not None else 0.0,
			"rows_csv": rows_count
		}
	except Exception as e:
		return None


def load_parquet_totals(parquet_path: Path) -> Optional[Dict[str, Any]]:
	"""
	Cargar Parquet y calcular totales de boxes y net_weight_kg.

	Args:
		parquet_path: Path al archivo Parquet

	Returns:
		Dict con totales calculados o None si hay error
	"""
	try:
		df = pl.read_parquet(parquet_path)
		
		# Verificar que existan las columnas necesarias
		if "boxes" not in df.columns or "net_weight_kg" not in df.columns:
			return None
		
		# Calcular sumas
		boxes_sum = df["boxes"].sum()
		kilos_sum = df["net_weight_kg"].sum()
		rows_count = len(df)
		
		return {
			"boxes_parquet_sum": boxes_sum if boxes_sum is not None else 0,
			"kilos_parquet_sum": kilos_sum if kilos_sum is not None else 0.0,
			"rows_parquet": rows_count
		}
	except Exception as e:
		return None


def compute_discrepancies(
	csv_totals: Dict[str, Any],
	parquet_totals: Dict[str, Any]
) -> Dict[str, Any]:
	"""
	Calcular discrepancias entre CSV y Parquet.

	Args:
		csv_totals: Totales del CSV
		parquet_totals: Totales del Parquet

	Returns:
		Dict con discrepancias y status
	"""
	delta_boxes = parquet_totals["boxes_parquet_sum"] - csv_totals["boxes_csv_sum"]
	delta_kilos = parquet_totals["kilos_parquet_sum"] - csv_totals["kilos_csv_sum"]
	
	# Determinar status
	if delta_boxes == 0 and delta_kilos == 0:
		status = "OK"
	else:
		status = "WARNING"
	
	return {
		"delta_boxes": delta_boxes,
		"delta_kilos": delta_kilos,
		"status": status
	}


def audit_all_files(data_raw_dir: Path, data_clean_dir: Path) -> List[Dict[str, Any]]:
	"""
	Auditar todos los archivos CSV y sus Parquets correspondientes.

	Args:
		data_raw_dir: Directorio con CSVs originales
		data_clean_dir: Directorio con Parquets normalizados

	Returns:
		Lista de resultados de auditoría
	"""
	csv_files = sorted(data_raw_dir.glob("*.csv"))
	audit_results = []
	
	print(f"Auditando {len(csv_files)} archivos...\n")
	
	for csv_file in tqdm(csv_files, desc="Auditando"):
		# Obtener nombre del Parquet correspondiente
		parquet_name = csv_file.stem + ".parquet"
		parquet_path = data_clean_dir / parquet_name
		
		# Cargar totales del CSV
		csv_totals = load_csv_totals(csv_file)
		if csv_totals is None:
			print(f"  ⚠️  No se pudo procesar CSV: {csv_file.name}")
			continue
		
		# Cargar totales del Parquet
		if not parquet_path.exists():
			print(f"  ⚠️  Parquet no encontrado: {parquet_name}")
			continue
		
		parquet_totals = load_parquet_totals(parquet_path)
		if parquet_totals is None:
			print(f"  ⚠️  No se pudo procesar Parquet: {parquet_name}")
			continue
		
		# Calcular discrepancias
		discrepancies = compute_discrepancies(csv_totals, parquet_totals)
		
		# Agregar resultado
		result = {
			"file": csv_file.name,
			"boxes_csv": csv_totals["boxes_csv_sum"],
			"boxes_parquet": parquet_totals["boxes_parquet_sum"],
			"delta_boxes": discrepancies["delta_boxes"],
			"kilos_csv": csv_totals["kilos_csv_sum"],
			"kilos_parquet": parquet_totals["kilos_parquet_sum"],
			"delta_kilos": discrepancies["delta_kilos"],
			"rows_csv": csv_totals["rows_csv"],
			"rows_parquet": parquet_totals["rows_parquet"],
			"status": discrepancies["status"]
		}
		
		audit_results.append(result)
	
	return audit_results


def generate_audit_report(audit_results: List[Dict[str, Any]], output_path: Path) -> None:
	"""
	Generar reporte CSV de auditoría.

	Args:
		audit_results: Lista de resultados de auditoría
		output_path: Path donde guardar el reporte
	"""
	output_path.parent.mkdir(parents=True, exist_ok=True)
	
	# Crear DataFrame con resultados
	df = pl.DataFrame(audit_results)
	
	# Guardar como CSV
	df.write_csv(output_path)
	
	print(f"\n✓ Reporte guardado: {output_path}")


def print_summary(audit_results: List[Dict[str, Any]]) -> None:
	"""
	Imprimir resumen de auditoría en consola.

	Args:
		audit_results: Lista de resultados de auditoría
	"""
	if not audit_results:
		print("No hay resultados para mostrar.")
		return
	
	# Contar archivos OK vs WARNING
	ok_count = sum(1 for r in audit_results if r["status"] == "OK")
	warning_count = sum(1 for r in audit_results if r["status"] == "WARNING")
	
	# Calcular totales globales
	total_boxes_csv = sum(r["boxes_csv"] for r in audit_results)
	total_boxes_parquet = sum(r["boxes_parquet"] for r in audit_results)
	total_kilos_csv = sum(r["kilos_csv"] for r in audit_results)
	total_kilos_parquet = sum(r["kilos_parquet"] for r in audit_results)
	
	# Calcular deltas globales
	global_delta_boxes = total_boxes_parquet - total_boxes_csv
	global_delta_kilos = total_kilos_parquet - total_kilos_csv
	
	# Calcular % mismatch
	pct_mismatch_boxes = (abs(global_delta_boxes) / total_boxes_csv * 100) if total_boxes_csv > 0 else 0
	pct_mismatch_kilos = (abs(global_delta_kilos) / total_kilos_csv * 100) if total_kilos_csv > 0 else 0
	
	# Encontrar peores discrepancias
	worst_boxes = max(audit_results, key=lambda x: abs(x["delta_boxes"]))
	worst_kilos = max(audit_results, key=lambda x: abs(x["delta_kilos"]))
	
	print("\n" + "="*60)
	print("RESUMEN DE AUDITORÍA")
	print("="*60)
	
	print(f"\nArchivos procesados: {len(audit_results)}")
	print(f"  ✓ OK: {ok_count}")
	print(f"  ⚠️  WARNING: {warning_count}")
	
	print(f"\nTotales globales:")
	print(f"  Boxes CSV:     {total_boxes_csv:,.0f}")
	print(f"  Boxes Parquet: {total_boxes_parquet:,.0f}")
	print(f"  Delta:         {global_delta_boxes:,.0f}")
	print(f"  % Mismatch:    {pct_mismatch_boxes:.4f}%")
	
	print(f"\n  Kilos CSV:     {total_kilos_csv:,.2f}")
	print(f"  Kilos Parquet: {total_kilos_parquet:,.2f}")
	print(f"  Delta:         {global_delta_kilos:,.2f}")
	print(f"  % Mismatch:    {pct_mismatch_kilos:.4f}%")
	
	print(f"\nPeores discrepancias:")
	print(f"  Boxes: {worst_boxes['file']}")
	print(f"    CSV: {worst_boxes['boxes_csv']:,.0f} | Parquet: {worst_boxes['boxes_parquet']:,.0f} | Delta: {worst_boxes['delta_boxes']:,.0f}")
	
	print(f"  Kilos: {worst_kilos['file']}")
	print(f"    CSV: {worst_kilos['kilos_csv']:,.2f} | Parquet: {worst_kilos['kilos_parquet']:,.2f} | Delta: {worst_kilos['delta_kilos']:,.2f}")
	
	print("="*60)


def main():
	"""Función principal del script de auditoría."""
	data_raw_dir = Path(__file__).parent.parent / "data_raw"
	data_clean_dir = Path(__file__).parent.parent / "data_clean"
	audit_dir = Path(__file__).parent.parent / "audit"
	output_path = audit_dir / "full_audit.csv"
	
	if not data_raw_dir.exists():
		print(f"Error: Directorio {data_raw_dir} no existe")
		return
	
	if not data_clean_dir.exists():
		print(f"Error: Directorio {data_clean_dir} no existe")
		print("Ejecuta primero scripts/normalize.py")
		return
	
	print("="*60)
	print("AUDITORÍA DE NORMALIZACIÓN")
	print("="*60)
	print("\nEste script compara datos CSV originales con Parquets normalizados")
	print("para detectar discrepancias en boxes y kilos.\n")
	print(f"Directorio CSV: {data_raw_dir}")
	print(f"Directorio Parquet: {data_clean_dir}")
	print(f"Reporte de salida: {output_path}")
	
	# Auditar todos los archivos
	audit_results = audit_all_files(data_raw_dir, data_clean_dir)
	
	if not audit_results:
		print("\nNo se encontraron archivos para auditar.")
		return
	
	# Generar reporte
	generate_audit_report(audit_results, output_path)
	
	# Imprimir resumen
	print_summary(audit_results)
	
	print("\n✓ Auditoría completada.")


if __name__ == "__main__":
	main()

