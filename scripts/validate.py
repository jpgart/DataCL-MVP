"""
Script de validación del dataset maestro consolidado.

Este script valida el esquema, calidad de datos y genera un reporte
de validación del dataset final exports_10_years.parquet.
"""

import polars as pl
import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime


def load_master_dataset(parquet_path: Path) -> pl.DataFrame:
	"""
	Cargar dataset maestro para validación.

	Args:
		parquet_path: Path al archivo exports_10_years.parquet

	Returns:
		DataFrame con el dataset maestro
	"""
	if not parquet_path.exists():
		raise FileNotFoundError(f"Archivo {parquet_path} no existe. Ejecuta primero scripts/combine.py")
	
	print(f"Cargando dataset maestro: {parquet_path}")
	df = pl.read_parquet(parquet_path)
	return df


def get_expected_totals_from_audit() -> Dict[str, Any]:
	"""
	Obtener totales esperados del reporte de auditoría.

	Returns:
		Dict con totales esperados (rows, boxes, kilos)
	"""
	audit_path = Path(__file__).parent.parent / "audit" / "full_audit.csv"
	
	if not audit_path.exists():
		print("  ⚠️  No se encontró audit/full_audit.csv, no se podrá comparar totales")
		return {
			"expected_rows": None,
			"expected_boxes": 5144111652,
			"expected_kilos": 25412581716.0
		}
	
	df_audit = pl.read_csv(audit_path)
	
	expected_rows = df_audit["rows_csv"].sum()
	expected_boxes = df_audit["boxes_csv"].sum()
	expected_kilos = df_audit["kilos_csv"].sum()
	
	return {
		"expected_rows": expected_rows,
		"expected_boxes": expected_boxes,
		"expected_kilos": expected_kilos
	}


def validate_schema(df: pl.DataFrame) -> Dict[str, Any]:
	"""
	Validar que el esquema del dataset coincida con el esperado.

	Args:
		df: DataFrame a validar

	Returns:
		Dict con resultados de validación del esquema
	"""
	print("Validando esquema...")
	
	# Schema esperado
	expected_columns = [
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
	
	# Columnas de metadatos permitidas (no se consideran "extra")
	metadata_columns = ["source_week"]
	
	expected_types = {
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
		"source_week": pl.Int64  # Tipo para columna de metadatos
	}
	
	actual_columns = df.columns
	actual_schema = df.schema
	
	# Verificar columnas
	missing_columns = set(expected_columns) - set(actual_columns)
	# Excluir columnas de metadatos de las "columnas extra"
	extra_columns = set(actual_columns) - set(expected_columns) - set(metadata_columns)
	
	# Verificar orden (solo para columnas esperadas, ignorando metadatos)
	actual_expected_columns = [col for col in actual_columns if col in expected_columns]
	order_ok = actual_expected_columns == expected_columns
	
	# Verificar tipos
	type_issues = []
	for col, expected_type in expected_types.items():
		if col in actual_columns:
			actual_type = actual_schema[col]
			if actual_type != expected_type:
				type_issues.append({
					"column": col,
					"expected": str(expected_type),
					"actual": str(actual_type)
				})
	
	schema_ok = (
		len(missing_columns) == 0 and
		len(extra_columns) == 0 and
		order_ok and
		len(type_issues) == 0
	)
	
	return {
		"schema_ok": schema_ok,
		"missing_columns": list(missing_columns),
		"extra_columns": list(extra_columns),
		"order_ok": order_ok,
		"type_issues": type_issues,
		"metadata_columns": [col for col in metadata_columns if col in actual_columns]
	}


def validate_types(df: pl.DataFrame) -> Dict[str, Any]:
	"""
	Validar tipos de datos específicos.

	Args:
		df: DataFrame a validar

	Returns:
		Dict con resultados de validación de tipos
	"""
	print("Validando tipos de datos...")
	
	type_checks = {
		"week": pl.Int64,
		"year": pl.Int64,
		"boxes": pl.Int64,
		"net_weight_kg": pl.Float64,
		"season": pl.Utf8,
		"region": pl.Utf8,
		"market": pl.Utf8,
		"country": pl.Utf8,
		"transport": pl.Utf8,
		"product": pl.Utf8,
		"variety": pl.Utf8,
		"importer": pl.Utf8,
		"exporter": pl.Utf8,
		"port_destination": pl.Utf8
	}
	
	types_ok = True
	type_errors = []
	
	for col, expected_type in type_checks.items():
		if col in df.columns:
			actual_type = df[col].dtype
			if actual_type != expected_type:
				types_ok = False
				type_errors.append({
					"column": col,
					"expected": str(expected_type),
					"actual": str(actual_type)
				})
	
	return {
		"types_ok": types_ok,
		"type_errors": type_errors
	}


def validate_nulls(df: pl.DataFrame) -> Dict[str, int]:
	"""
	Validar valores nulos.

	Args:
		df: DataFrame a validar

	Returns:
		Dict con conteo de nulos por columna
	"""
	print("Validando valores nulos...")
	
	null_counts = {}
	required_columns = ["season", "week", "year", "country", "product", "exporter"]
	optional_columns = ["port_destination"]
	
	for col in df.columns:
		null_count = df[col].null_count()
		null_counts[col] = null_count
	
	return null_counts


def validate_outliers(df: pl.DataFrame) -> Dict[str, Any]:
	"""
	Validar outliers y rangos de valores.

	Args:
		df: DataFrame a validar

	Returns:
		Dict con conteo de outliers por tipo
	"""
	print("Validando outliers...")
	
	current_year = datetime.now().year
	
	outliers = {
		"week_out_of_range": 0,
		"year_out_of_range": 0,
		"negative_boxes": 0,
		"negative_kilos": 0
	}
	
	# Week debe estar en 1-53
	if "week" in df.columns:
		week_out = df.filter((pl.col("week") < 1) | (pl.col("week") > 53))
		outliers["week_out_of_range"] = len(week_out)
	
	# Year debe estar entre 1990 y año actual
	if "year" in df.columns:
		year_out = df.filter((pl.col("year") < 1990) | (pl.col("year") > current_year))
		outliers["year_out_of_range"] = len(year_out)
	
	# Boxes debe ser >= 0
	if "boxes" in df.columns:
		negative_boxes = df.filter(pl.col("boxes") < 0)
		outliers["negative_boxes"] = len(negative_boxes)
	
	# net_weight_kg debe ser >= 0
	if "net_weight_kg" in df.columns:
		negative_kilos = df.filter(pl.col("net_weight_kg") < 0)
		outliers["negative_kilos"] = len(negative_kilos)
	
	return outliers


def validate_duplicates(df: pl.DataFrame) -> int:
	"""
	Validar filas duplicadas.

	Args:
		df: DataFrame a validar

	Returns:
		Número de filas duplicadas
	"""
	print("Validando duplicados...")
	
	# Contar filas duplicadas (excluyendo la primera ocurrencia)
	duplicate_rows = df.filter(df.is_duplicated())
	return len(duplicate_rows)


def validate_totals(df: pl.DataFrame, expected_totals: Dict[str, Any]) -> Dict[str, Any]:
	"""
	Validar totales de boxes y kilos.

	Args:
		df: DataFrame a validar
		expected_totals: Totales esperados del audit

	Returns:
		Dict con resultados de validación de totales
	"""
	print("Validando totales...")
	
	total_boxes = df["boxes"].sum() if "boxes" in df.columns else 0
	total_kilos = df["net_weight_kg"].sum() if "net_weight_kg" in df.columns else 0.0
	
	expected_boxes = expected_totals.get("expected_boxes", 5144111652)
	expected_kilos = expected_totals.get("expected_kilos", 25412581716.0)
	
	boxes_match = total_boxes == expected_boxes
	kilos_match = total_kilos == expected_kilos
	
	totals_match_csv = boxes_match and kilos_match
	
	return {
		"total_boxes": int(total_boxes),
		"total_kilos": float(total_kilos),
		"expected_boxes": int(expected_boxes),
		"expected_kilos": float(expected_kilos),
		"boxes_match": boxes_match,
		"kilos_match": kilos_match,
		"totals_match_csv": totals_match_csv
	}


def validate_row_count(df: pl.DataFrame, expected_totals: Dict[str, Any]) -> Dict[str, Any]:
	"""
	Validar conteo de filas.

	Args:
		df: DataFrame a validar
		expected_totals: Totales esperados del audit

	Returns:
		Dict con resultados de validación de filas
	"""
	print("Validando conteo de filas...")
	
	total_rows = len(df)
	expected_rows = expected_totals.get("expected_rows")
	
	row_count_ok = True
	warning = None
	
	if expected_rows is not None:
		if total_rows < expected_rows:
			row_count_ok = False
			warning = f"Total de filas ({total_rows:,}) es menor que el esperado ({expected_rows:,})"
		elif total_rows > expected_rows:
			warning = f"Total de filas ({total_rows:,}) es mayor que el esperado ({expected_rows:,})"
	
	return {
		"total_rows": total_rows,
		"expected_rows": expected_rows,
		"row_count_ok": row_count_ok,
		"warning": warning
	}


def generate_validation_report(
	df: pl.DataFrame,
	schema_validation: Dict[str, Any],
	types_validation: Dict[str, Any],
	null_counts: Dict[str, int],
	outliers: Dict[str, Any],
	duplicates: int,
	totals_validation: Dict[str, Any],
	row_count_validation: Dict[str, Any],
	output_path: Path
) -> None:
	"""
	Generar reporte de validación completo en formato JSON.

	Args:
		df: DataFrame validado
		schema_validation: Resultados de validación del esquema
		types_validation: Resultados de validación de tipos
		null_counts: Conteo de nulos por columna
		outliers: Conteo de outliers
		duplicates: Número de duplicados
		totals_validation: Resultados de validación de totales
		row_count_validation: Resultados de validación de filas
		output_path: Path donde guardar el reporte JSON
	"""
	output_path.parent.mkdir(parents=True, exist_ok=True)
	
	# Recopilar warnings
	warnings = []
	
	if not schema_validation["schema_ok"]:
		warnings.append("Schema no coincide con el esperado")
		if schema_validation["missing_columns"]:
			warnings.append(f"Columnas faltantes: {schema_validation['missing_columns']}")
		if schema_validation["extra_columns"]:
			warnings.append(f"Columnas extra: {schema_validation['extra_columns']}")
		if not schema_validation["order_ok"]:
			warnings.append("Orden de columnas incorrecto")
	
	if not types_validation["types_ok"]:
		warnings.append("Tipos de datos incorrectos")
		for error in types_validation["type_errors"]:
			warnings.append(f"  - {error['column']}: esperado {error['expected']}, actual {error['actual']}")
	
	# Verificar nulos en columnas requeridas
	required_columns = ["season", "week", "year", "country", "product", "exporter"]
	for col in required_columns:
		if col in null_counts and null_counts[col] > 0:
			warnings.append(f"Columna requerida '{col}' tiene {null_counts[col]} valores nulos")
	
	# Verificar outliers
	if outliers["week_out_of_range"] > 0:
		warnings.append(f"Week fuera de rango (1-53): {outliers['week_out_of_range']} filas")
	if outliers["year_out_of_range"] > 0:
		warnings.append(f"Year fuera de rango (1990-{datetime.now().year}): {outliers['year_out_of_range']} filas")
	if outliers["negative_boxes"] > 0:
		warnings.append(f"Boxes negativos: {outliers['negative_boxes']} filas")
	if outliers["negative_kilos"] > 0:
		warnings.append(f"Kilos negativos: {outliers['negative_kilos']} filas")
	
	# Verificar duplicados
	if duplicates > 0:
		warnings.append(f"Filas duplicadas: {duplicates}")
	
	# Verificar totales
	if not totals_validation["totals_match_csv"]:
		warnings.append("Totales no coinciden con CSV audit")
		if not totals_validation["boxes_match"]:
			warnings.append(f"  - Boxes: esperado {totals_validation['expected_boxes']:,}, actual {totals_validation['total_boxes']:,}")
		if not totals_validation["kilos_match"]:
			warnings.append(f"  - Kilos: esperado {totals_validation['expected_kilos']:,.2f}, actual {totals_validation['total_kilos']:,.2f}")
	
	# Verificar conteo de filas
	if row_count_validation.get("warning"):
		warnings.append(row_count_validation["warning"])
	
	# Crear reporte JSON
	report = {
		"total_rows": row_count_validation["total_rows"],
		"expected_rows": row_count_validation.get("expected_rows"),
		"total_boxes": totals_validation["total_boxes"],
		"total_kilos": totals_validation["total_kilos"],
		"expected_boxes": totals_validation["expected_boxes"],
		"expected_kilos": totals_validation["expected_kilos"],
		"missing_values": null_counts,
		"duplicates": duplicates,
		"schema_ok": schema_validation["schema_ok"],
		"types_ok": types_validation["types_ok"],
		"totals_match_csv": totals_validation["totals_match_csv"],
		"outliers": outliers,
		"warnings": warnings
	}
	
	# Guardar reporte JSON
	with open(output_path, 'w', encoding='utf-8') as f:
		json.dump(report, f, indent=2, ensure_ascii=False)
	
	# Imprimir resumen
	print("\n" + "="*60)
	print("REPORTE DE VALIDACIÓN")
	print("="*60)
	print(f"Total de filas:     {row_count_validation['total_rows']:,}")
	print(f"Total de boxes:     {totals_validation['total_boxes']:,}")
	print(f"Total de kilos:     {totals_validation['total_kilos']:,.2f}")
	print(f"\nSchema OK:          {schema_validation['schema_ok']}")
	print(f"Tipos OK:           {types_validation['types_ok']}")
	print(f"Totales match CSV:  {totals_validation['totals_match_csv']}")
	print(f"Duplicados:         {duplicates}")
	print(f"\nWarnings:           {len(warnings)}")
	if warnings:
		for warning in warnings:
			print(f"  ⚠️  {warning}")
	else:
		print("  ✓ Ninguno")
	print("="*60)
	print(f"\n✓ Reporte guardado: {output_path}")


def main():
	"""Función principal del script de validación."""
	data_dir = Path(__file__).parent.parent / "data"
	audit_dir = Path(__file__).parent.parent / "audit"
	parquet_path = data_dir / "exports_10_years.parquet"
	report_path = audit_dir / "final_validation.json"
	
	print("="*60)
	print("VALIDACIÓN DEL DATASET MAESTRO")
	print("="*60)
	print("\nEste script valida el esquema, calidad de datos")
	print("y genera un reporte de validación completo.\n")
	print(f"Dataset: {parquet_path}")
	print(f"Reporte: {report_path}")
	print("\nPara validar: python scripts/validate.py\n")
	
	if not parquet_path.exists():
		print(f"Error: Archivo {parquet_path} no existe")
		print("Ejecuta primero scripts/combine.py")
		return
	
	try:
		# Cargar dataset
		df = load_master_dataset(parquet_path)
		
		# Obtener totales esperados del audit
		expected_totals = get_expected_totals_from_audit()
		
		# Validar schema
		schema_validation = validate_schema(df)
		
		# Validar tipos
		types_validation = validate_types(df)
		
		# Validar nulos
		null_counts = validate_nulls(df)
		
		# Validar outliers
		outliers = validate_outliers(df)
		
		# Validar duplicados
		duplicates = validate_duplicates(df)
		
		# Validar totales
		totals_validation = validate_totals(df, expected_totals)
		
		# Validar conteo de filas
		row_count_validation = validate_row_count(df, expected_totals)
		
		# Generar reporte
		generate_validation_report(
			df,
			schema_validation,
			types_validation,
			null_counts,
			outliers,
			duplicates,
			totals_validation,
			row_count_validation,
			report_path
		)
		
		print("\n✓ Validación completada.")
		
	except Exception as e:
		print(f"\n✗ Error durante validación: {e}")
		raise


if __name__ == "__main__":
	main()
