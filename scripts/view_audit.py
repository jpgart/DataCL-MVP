"""
Script para visualizar el reporte de auditoría en formato tabla.

Uso:
    python scripts/view_audit.py
    python scripts/view_audit.py --head 20
    python scripts/view_audit.py --summary
    python scripts/view_audit.py --warnings
"""

import polars as pl
import argparse
from pathlib import Path


def view_audit_table(limit: int = None, summary: bool = False, warnings_only: bool = False):
	"""
	Visualizar el reporte de auditoría en formato tabla.

	Args:
		limit: Número de filas a mostrar (None = todas)
		summary: Mostrar solo resumen estadístico
		warnings_only: Mostrar solo archivos con WARNING
	"""
	audit_path = Path(__file__).parent.parent / "audit" / "full_audit.csv"
	
	if not audit_path.exists():
		print(f"Error: No se encontró el archivo {audit_path}")
		return
	
	# Cargar CSV
	df = pl.read_csv(audit_path)
	
	if summary:
		# Mostrar resumen estadístico
		print("="*80)
		print("RESUMEN DE AUDITORÍA")
		print("="*80)
		
		total_files = len(df)
		ok_files = len(df.filter(pl.col("status") == "OK"))
		warning_files = len(df.filter(pl.col("status") == "WARNING"))
		
		total_boxes_csv = df["boxes_csv"].sum()
		total_boxes_parquet = df["boxes_parquet"].sum()
		total_kilos_csv = df["kilos_csv"].sum()
		total_kilos_parquet = df["kilos_parquet"].sum()
		
		delta_boxes = total_boxes_parquet - total_boxes_csv
		delta_kilos = total_kilos_parquet - total_kilos_csv
		
		print(f"\nArchivos procesados: {total_files}")
		print(f"  ✓ OK: {ok_files}")
		print(f"  ⚠️  WARNING: {warning_files}")
		
		print(f"\nTotales globales:")
		print(f"  Boxes CSV:     {total_boxes_csv:,.0f}")
		print(f"  Boxes Parquet: {total_boxes_parquet:,.0f}")
		print(f"  Delta:         {delta_boxes:,.0f}")
		
		print(f"\n  Kilos CSV:     {total_kilos_csv:,.2f}")
		print(f"  Kilos Parquet: {total_kilos_parquet:,.2f}")
		print(f"  Delta:         {delta_kilos:,.2f}")
		
		# Peores discrepancias
		if warning_files > 0:
			worst_boxes = df.filter(pl.col("status") == "WARNING").sort("delta_boxes", descending=True).head(1)
			worst_kilos = df.filter(pl.col("status") == "WARNING").sort("delta_kilos", descending=True).head(1)
			
			print(f"\nPeores discrepancias:")
			if len(worst_boxes) > 0:
				print(f"  Boxes: {worst_boxes['file'][0]}")
				print(f"    Delta: {worst_boxes['delta_boxes'][0]:,.0f}")
			if len(worst_kilos) > 0:
				print(f"  Kilos: {worst_kilos['file'][0]}")
				print(f"    Delta: {worst_kilos['delta_kilos'][0]:,.2f}")
		
		print("="*80)
		return
	
	# Filtrar si es necesario
	if warnings_only:
		df = df.filter(pl.col("status") == "WARNING")
		if len(df) == 0:
			print("✓ No hay archivos con WARNING. Todos los archivos están OK.")
			return
	
	# Limitar filas si se especifica
	if limit:
		df = df.head(limit)
	
	# Mostrar tabla
	print("="*80)
	print("REPORTE DE AUDITORÍA")
	print("="*80)
	print(f"\nMostrando {len(df)} de {len(pl.read_csv(audit_path))} archivos\n")
	
	# Configurar formato de visualización
	pl.Config.set_tbl_rows(len(df))  # Mostrar todas las filas
	pl.Config.set_tbl_cols(-1)  # Mostrar todas las columnas
	
	print(df)
	print("\n" + "="*80)


def main():
	"""Función principal."""
	parser = argparse.ArgumentParser(
		description="Visualizar reporte de auditoría en formato tabla",
		formatter_class=argparse.RawDescriptionHelpFormatter,
		epilog="""
Ejemplos:
  python scripts/view_audit.py              # Mostrar todas las filas
  python scripts/view_audit.py --head 20    # Mostrar primeras 20 filas
  python scripts/view_audit.py --summary    # Mostrar solo resumen
  python scripts/view_audit.py --warnings   # Mostrar solo archivos con WARNING
		"""
	)
	
	parser.add_argument(
		"--head",
		type=int,
		help="Número de filas a mostrar"
	)
	
	parser.add_argument(
		"--summary",
		action="store_true",
		help="Mostrar solo resumen estadístico"
	)
	
	parser.add_argument(
		"--warnings",
		action="store_true",
		help="Mostrar solo archivos con WARNING"
	)
	
	args = parser.parse_args()
	
	view_audit_table(
		limit=args.head,
		summary=args.summary,
		warnings_only=args.warnings
	)


if __name__ == "__main__":
	main()

