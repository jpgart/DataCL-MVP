"""
Script para generar schema_master.json basado en resultados del inventario.

Este script lee column_inventory.json y column_frequency.json,
infiere el esquema estandarizado y genera schema_master.json.
"""

import json
import re
from pathlib import Path
from typing import Dict, Any, List


def load_inventory_results(scripts_dir: Path) -> Dict[str, Any]:
	"""
	Cargar resultados del inventario.

	Args:
		scripts_dir: Directorio donde están los archivos JSON

	Returns:
		Dict con inventario y frecuencia de columnas
	"""
	inventory_path = scripts_dir / "column_inventory.json"
	frequency_path = scripts_dir / "column_frequency.json"
	
	if not inventory_path.exists() or not frequency_path.exists():
		raise FileNotFoundError(
			"Archivos de inventario no encontrados. Ejecuta primero scripts/inventory.py"
		)
	
	with open(inventory_path, 'r', encoding='utf-8') as f:
		inventory = json.load(f)
	
	with open(frequency_path, 'r', encoding='utf-8') as f:
		frequency = json.load(f)
	
	return {"inventory": inventory, "frequency": frequency}


def suggest_normalized_name(column_name: str) -> str:
	"""
	Sugerir nombre normalizado en snake_case.

	Args:
		column_name: Nombre de columna original

	Returns:
		Nombre sugerido en snake_case
	"""
	name = column_name.strip()
	name = re.sub(r'[\s\-]+', '_', name)
	name = name.lower()
	name = re.sub(r'[^a-z0-9_]', '', name)
	name = re.sub(r'_+', '_', name)
	name = name.strip('_')
	return name


def infer_column_type(column_name: str, frequency: Dict[str, int], total_files: int) -> str:
	"""
	Inferir tipo de dato para una columna basado en su nombre.

	Args:
		column_name: Nombre de la columna
		frequency: Dict con frecuencia de columnas
		total_files: Total de archivos analizados

	Returns:
		Tipo de dato inferido: "int64", "float64", "string", etc.
	"""
	name_lower = column_name.lower()
	normalized = suggest_normalized_name(column_name)
	
	# Patrones para inferir tipos
	if any(keyword in normalized for keyword in ['week', 'semana', 'año', 'year']):
		return "int64"
	elif any(keyword in normalized for keyword in ['weight', 'peso', 'kg', 'kilogram']):
		return "float64"
	elif any(keyword in normalized for keyword in ['value', 'valor', 'usd', 'dollar', 'precio']):
		return "float64"
	elif any(keyword in normalized for keyword in ['code', 'codigo', 'hs_code', 'hs']):
		return "string"
	elif any(keyword in normalized for keyword in ['date', 'fecha']):
		return "string"  # Podría ser date, pero por ahora string
	else:
		return "string"


def create_column_mapping(
	inventory: Dict[str, List[str]],
	frequency: Dict[str, int]
) -> Dict[str, str]:
	"""
	Crear mapeo de nombres raw a nombres normalizados.

	Args:
		inventory: Inventario de columnas por archivo
		frequency: Frecuencia de cada columna

	Returns:
		Dict con mapeo raw_name -> normalized_name
	"""
	mapping = {}
	normalized_groups = {}
	
	# Agrupar columnas por nombre normalizado
	for col_name in frequency.keys():
		normalized = suggest_normalized_name(col_name)
		if normalized not in normalized_groups:
			normalized_groups[normalized] = []
		normalized_groups[normalized].append(col_name)
	
	# Para cada grupo, usar la columna más frecuente como referencia
	for normalized, raw_names in normalized_groups.items():
		# Encontrar la columna más frecuente del grupo
		most_frequent = max(raw_names, key=lambda x: frequency.get(x, 0))
		# Mapear todas las variaciones al nombre normalizado
		for raw_name in raw_names:
			mapping[raw_name] = normalized
	
	return mapping


def infer_master_schema(
	inventory: Dict[str, List[str]],
	frequency: Dict[str, int]
) -> Dict[str, Dict[str, Any]]:
	"""
	Inferir esquema maestro basado en columnas más frecuentes.

	Args:
		inventory: Inventario de columnas por archivo
		frequency: Frecuencia de cada columna

	Returns:
		Dict con esquema maestro
	"""
	total_files = len(inventory)
	threshold = total_files * 0.5  # Columnas que aparecen en al menos 50% de archivos
	
	# Columnas esperadas con sus nombres normalizados
	expected_fields = {
		"week": ["week", "semana", "week_number", "etd_week", "etd week"],
		"year": ["year", "año", "ano", "año_exportacion"],
		"season": ["season", "temporada", "estacion"],
		"hs_code": ["hs_code", "hs", "codigo_hs", "hs_codigo", "codigo"],
		"product": ["product", "producto", "descripcion", "descripcion_producto", "specie", "variety"],
		"exporter": ["exporter", "exportador", "empresa", "empresa_exportadora"],
		"country": ["country", "pais", "país", "destino", "pais_destino"],
		"port_destination": ["port", "puerto", "puerto_destino", "port_destination", "puerto_destinacion", "arrival_port", "arrival port"],
		"net_weight_kg": ["weight", "peso", "net_weight", "peso_neto", "net_weight_kg", "kilogramos", "kilograms"],
		"value_usd": ["value", "valor", "usd", "value_usd", "valor_usd", "dollar", "dolares", "boxes"]
	}
	
	schema = {}
	
	# Buscar columnas que coincidan con campos esperados
	for field_name, possible_names in expected_fields.items():
		# Buscar la columna más frecuente que coincida
		best_match = None
		best_freq = 0
		
		for col_name, freq in frequency.items():
			normalized = suggest_normalized_name(col_name)
			for possible in possible_names:
				if possible in normalized or normalized in possible:
					if freq > best_freq:
						best_match = col_name
						best_freq = freq
					break
		
		if best_match and best_freq >= threshold:
			col_type = infer_column_type(best_match, frequency, total_files)
			required = field_name != "port_destination"  # port_destination es opcional
			
			schema[field_name] = {
				"type": col_type,
				"required": required,
				"source_column": best_match,
				"frequency": best_freq
			}
		else:
			# Campo esperado pero no encontrado - crear con valores por defecto
			col_type = "int64" if field_name in ["week", "year"] else "float64" if "weight" in field_name or "value" in field_name else "string"
			required = field_name != "port_destination"
			
			schema[field_name] = {
				"type": col_type,
				"required": required,
				"source_column": None,
				"frequency": 0
			}
	
	return schema


def generate_schema_master(scripts_dir: Path) -> None:
	"""
	Generar schema_master.json basado en resultados del inventario.

	Args:
		scripts_dir: Directorio donde están los archivos y donde guardar schema_master.json
	"""
	print("Generando schema_master.json...")
	
	# Cargar resultados del inventario
	data = load_inventory_results(scripts_dir)
	inventory = data["inventory"]
	frequency = data["frequency"]
	
	# Inferir esquema maestro
	schema = infer_master_schema(inventory, frequency)
	
	# Crear mapeo de columnas
	column_mapping = create_column_mapping(inventory, frequency)
	
	# Crear estructura final
	schema_master = {
		"schema": schema,
		"column_mapping": column_mapping,
		"metadata": {
			"total_files_analyzed": len(inventory),
			"total_unique_columns": len(frequency)
		}
	}
	
	# Guardar schema_master.json
	schema_path = scripts_dir / "schema_master.json"
	with open(schema_path, 'w', encoding='utf-8') as f:
		json.dump(schema_master, f, indent=2, ensure_ascii=False)
	
	print(f"✓ Schema maestro guardado: {schema_path}")
	print(f"\nCampos del esquema:")
	for field_name, field_info in schema.items():
		source = field_info.get("source_column") or "N/A"
		freq = field_info.get("frequency", 0)
		required = "✓" if field_info.get("required", False) else "○"
		print(f"  {required} {field_name:20s} ({field_info['type']:8s}) <- {source:30s} [{freq} archivos]")


def main():
	"""Función principal."""
	scripts_dir = Path(__file__).parent
	
	try:
		generate_schema_master(scripts_dir)
		print("\n✓ Generación de schema completada.")
	except FileNotFoundError as e:
		print(f"\n✗ Error: {e}")
	except Exception as e:
		print(f"\n✗ Error inesperado: {e}")


if __name__ == "__main__":
	main()

