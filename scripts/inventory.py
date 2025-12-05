"""
Script de inventario y análisis de archivos CSV.

Este script escanea los archivos CSV en data_raw/, analiza sus columnas
y genera un reporte de la estructura de los datos.
"""

import polars as pl
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Set
from collections import Counter
from tqdm import tqdm


def scan_csv_files(data_raw_dir: Path) -> List[Path]:
	"""
	Escanear directorio data_raw/ y retornar lista de archivos CSV.

	Args:
		data_raw_dir: Ruta al directorio con CSVs originales

	Returns:
		Lista de paths a archivos CSV encontrados, ordenados por nombre
	"""
	print(f"Escaneando directorio: {data_raw_dir}")
	csv_files = sorted(data_raw_dir.glob("*.csv"))
	print(f"Encontrados {len(csv_files)} archivos CSV")
	return csv_files


def read_csv_headers(csv_file: Path) -> List[str]:
	"""
	Leer solo los headers de un archivo CSV (rápido).

	Args:
		csv_file: Path al archivo CSV

	Returns:
		Lista de nombres de columnas
	"""
	try:
		# Leer solo la primera línea para obtener headers
		with open(csv_file, 'r', encoding='utf-8') as f:
			first_line = f.readline().strip()
		# Intentar detectar separador
		if ';' in first_line:
			separator = ';'
		else:
			separator = ','
		
		headers = [col.strip() for col in first_line.split(separator)]
		return headers
	except UnicodeDecodeError:
		# Intentar con latin-1 si utf-8 falla
		try:
			with open(csv_file, 'r', encoding='latin-1') as f:
				first_line = f.readline().strip()
			if ';' in first_line:
				separator = ';'
			else:
				separator = ','
			headers = [col.strip() for col in first_line.split(separator)]
			return headers
		except Exception as e:
			print(f"  ⚠️  Error leyendo headers de {csv_file.name}: {e}")
			return []
	except Exception as e:
		print(f"  ⚠️  Error leyendo {csv_file.name}: {e}")
		return []


def suggest_normalized_name(column_name: str) -> str:
	"""
	Sugerir nombre normalizado en snake_case para una columna.

	Args:
		column_name: Nombre de columna original

	Returns:
		Nombre sugerido en snake_case
	"""
	# Limpiar espacios
	name = column_name.strip()
	
	# Reemplazar espacios y guiones con underscore
	name = re.sub(r'[\s\-]+', '_', name)
	
	# Convertir a minúsculas
	name = name.lower()
	
	# Remover caracteres especiales excepto underscore
	name = re.sub(r'[^a-z0-9_]', '', name)
	
	# Remover underscores múltiples
	name = re.sub(r'_+', '_', name)
	
	# Remover underscores al inicio y final
	name = name.strip('_')
	
	return name


def collect_unique_columns(csv_files: List[Path]) -> Dict[str, Any]:
	"""
	Recopilar todas las columnas únicas de todos los CSVs.

	Args:
		csv_files: Lista de archivos CSV a analizar

	Returns:
		Dict con información de columnas: únicas, variaciones, frecuencia
	"""
	print("\nRecopilando columnas únicas...")
	
	column_inventory = {}
	all_columns = []
	column_variations = {}
	
	for csv_file in tqdm(csv_files, desc="Leyendo headers"):
		headers = read_csv_headers(csv_file)
		if headers:
			column_inventory[csv_file.name] = headers
			all_columns.extend(headers)
			
			# Detectar variaciones de nombres similares
			for header in headers:
				normalized = suggest_normalized_name(header)
				if normalized not in column_variations:
					column_variations[normalized] = []
				if header not in column_variations[normalized]:
					column_variations[normalized].append(header)
	
	# Contar frecuencia de cada columna
	column_frequency = Counter(all_columns)
	
	# Identificar columnas únicas
	unique_columns = set(all_columns)
	
	return {
		"inventory": column_inventory,
		"unique_columns": sorted(list(unique_columns)),
		"frequency": dict(column_frequency),
		"variations": column_variations
	}


def detect_naming_inconsistencies(column_data: Dict[str, Any]) -> Dict[str, List[str]]:
	"""
	Detectar inconsistencias en nombres de columnas.

	Args:
		column_data: Datos de columnas recopilados

	Returns:
		Dict con variaciones detectadas agrupadas por nombre normalizado
	"""
	inconsistencies = {}
	variations = column_data.get("variations", {})
	
	for normalized_name, raw_names in variations.items():
		if len(raw_names) > 1:
			inconsistencies[normalized_name] = raw_names
	
	return inconsistencies


def generate_inventory_files(
	column_data: Dict[str, Any],
	output_dir: Path
) -> None:
	"""
	Generar archivos JSON con inventario de columnas.

	Args:
		column_data: Datos de columnas recopilados
		output_dir: Directorio donde guardar los archivos
	"""
	output_dir.mkdir(parents=True, exist_ok=True)
	
	# Guardar inventario completo
	inventory_path = output_dir / "column_inventory.json"
	with open(inventory_path, 'w', encoding='utf-8') as f:
		json.dump(column_data["inventory"], f, indent=2, ensure_ascii=False)
	print(f"\n✓ Inventario guardado: {inventory_path}")
	
	# Guardar frecuencia de columnas
	frequency_path = output_dir / "column_frequency.json"
	frequency_sorted = dict(sorted(
		column_data["frequency"].items(),
		key=lambda x: x[1],
		reverse=True
	))
	with open(frequency_path, 'w', encoding='utf-8') as f:
		json.dump(frequency_sorted, f, indent=2, ensure_ascii=False)
	print(f"✓ Frecuencia guardada: {frequency_path}")


def print_summary_report(column_data: Dict[str, Any]) -> None:
	"""
	Imprimir reporte resumido en consola.

	Args:
		column_data: Datos de columnas recopilados
	"""
	print("\n" + "="*60)
	print("REPORTE DE INVENTARIO")
	print("="*60)
	
	inventory = column_data["inventory"]
	unique_columns = column_data["unique_columns"]
	frequency = column_data["frequency"]
	variations = column_data["variations"]
	
	print(f"\nTotal de archivos CSV analizados: {len(inventory)}")
	print(f"Total de columnas únicas encontradas: {len(unique_columns)}")
	
	# Top 20 columnas más frecuentes
	print("\n" + "-"*60)
	print("TOP 20 COLUMNAS MÁS FRECUENTES:")
	print("-"*60)
	top_columns = sorted(frequency.items(), key=lambda x: x[1], reverse=True)[:20]
	for col_name, count in top_columns:
		percentage = (count / len(inventory)) * 100
		print(f"  {col_name:40s} {count:4d} archivos ({percentage:5.1f}%)")
	
	# Inconsistencias detectadas
	inconsistencies = detect_naming_inconsistencies(column_data)
	if inconsistencies:
		print("\n" + "-"*60)
		print(f"INCONSISTENCIAS DETECTADAS ({len(inconsistencies)} grupos):")
		print("-"*60)
		for normalized, raw_names in list(inconsistencies.items())[:10]:
			print(f"\n  Nombre normalizado sugerido: {normalized}")
			print(f"  Variaciones encontradas:")
			for raw_name in raw_names:
				print(f"    - {raw_name}")
		if len(inconsistencies) > 10:
			print(f"\n  ... y {len(inconsistencies) - 10} grupos más")
	
	# Sugerencias de nombres normalizados para columnas más frecuentes
	print("\n" + "-"*60)
	print("SUGERENCIAS DE NOMBRES NORMALIZADOS (snake_case):")
	print("-"*60)
	for col_name, count in top_columns[:15]:
		normalized = suggest_normalized_name(col_name)
		if normalized != col_name.lower().replace(' ', '_'):
			print(f"  {col_name:40s} → {normalized}")
	
	print("\n" + "="*60)


def main():
	"""Función principal del script de inventario."""
	data_raw_dir = Path(__file__).parent.parent / "data_raw"
	scripts_dir = Path(__file__).parent
	
	if not data_raw_dir.exists():
		print(f"Error: Directorio {data_raw_dir} no existe")
		return
	
	print("Iniciando inventario de archivos CSV...")
	
	# Escanear archivos
	csv_files = scan_csv_files(data_raw_dir)
	
	if not csv_files:
		print("No se encontraron archivos CSV en data_raw/")
		return
	
	# Recopilar columnas
	column_data = collect_unique_columns(csv_files)
	
	# Generar archivos JSON
	generate_inventory_files(column_data, scripts_dir)
	
	# Imprimir reporte
	print_summary_report(column_data)
	
	print("\n✓ Inventario completado.")


if __name__ == "__main__":
	main()
