#!/usr/bin/env python3
"""
Script para extraer productos y variedades únicos del dataset MVP
y generar un JSON de referencia inicial para el sistema de búsqueda.
"""

import json
import polars as pl
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Set
from datetime import datetime


def extract_product_variety_reference(
    parquet_path: Path, output_path: Path
) -> Dict:
    """
    Extrae productos y variedades únicos del dataset y genera estructura JSON.
    
    Args:
        parquet_path: Ruta al archivo Parquet del dataset MVP
        output_path: Ruta donde guardar el JSON de referencia
    
    Returns:
        Dict con estadísticas de extracción
    """
    print(f"[INFO] Leyendo dataset desde {parquet_path}")
    
    if not parquet_path.exists():
        raise FileNotFoundError(f"Dataset no encontrado: {parquet_path}")
    
    # Leer Parquet
    df = pl.read_parquet(str(parquet_path))
    
    print(f"[INFO] Dataset cargado: {df.height:,} registros")
    
    # Extraer productos únicos con conteo
    products_df = (
        df.group_by("product")
        .agg([
            pl.len().alias("record_count"),
            pl.col("variety").n_unique().alias("variety_count")
        ])
        .sort("record_count", descending=True)
    )
    
    products_list = products_df["product"].to_list()
    product_counts = dict(zip(
        products_df["product"].to_list(),
        products_df["record_count"].to_list()
    ))
    
    print(f"[INFO] Productos únicos encontrados: {len(products_list)}")
    
    # Extraer variedades agrupadas por producto
    varieties_by_product: Dict[str, Set[str]] = defaultdict(set)
    variety_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    
    for row in df.select(["product", "variety"]).iter_rows():
        product = row[0] if row[0] else "Unknown"
        variety = row[1] if row[1] else "Unknown"
        varieties_by_product[product].add(variety)
        variety_counts[product][variety] += 1
    
    # Convertir sets a listas ordenadas
    varieties_by_product_clean = {
        product: sorted(list(varieties))
        for product, varieties in varieties_by_product.items()
    }
    
    print(f"[INFO] Variedades encontradas por producto:")
    for product, varieties in varieties_by_product_clean.items():
        print(f"  - {product}: {len(varieties)} variedades")
    
    # Generar estructura JSON base
    reference_data = {
        "metadata": {
            "source_dataset": str(parquet_path),
            "total_records": int(df.height),
            "total_products": len(products_list),
            "extraction_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "products": {},
        "varieties": {}
    }
    
    # Crear estructura para cada producto
    for product in products_list:
        # Generar ID canónico (lowercase, espacios a underscores)
        product_id = product.lower().replace(" ", "_").replace("-", "_")
        
        # Obtener variedades de este producto
        varieties = varieties_by_product_clean.get(product, [])
        
        # Estructura del producto
        reference_data["products"][product_id] = {
            "id": product_id,
            "canonical_name": product,
            "names": {
                "en": [product],  # Base, se puede enriquecer manualmente
                "es": []  # Se debe completar manualmente
            },
            "dataset_matches": [product],  # Nombre exacto en el dataset
            "description": {
                "en": f"Fresh {product.lower()} for export",
                "es": f"{product.lower()} fresco para exportación"
            },
            "record_count": product_counts.get(product, 0),
            "variety_count": len(varieties),
            "varieties": {
                "common": varieties[:10],  # Top 10 variedades
                "dataset_varieties": varieties  # Todas las variedades
            }
        }
        
        # Crear estructura de variedades para este producto
        if varieties:
            reference_data["varieties"][product_id] = {}
            for variety in varieties:
                variety_id = variety.lower().replace(" ", "_").replace("-", "_")
                reference_data["varieties"][product_id][variety_id] = {
                    "names": {
                        "en": [variety],  # Base, se puede enriquecer
                        "es": []  # Se debe completar manualmente
                    },
                    "dataset_matches": [variety],  # Nombre exacto
                    "record_count": variety_counts[product].get(variety, 0)
                }
    
    # Guardar JSON
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(reference_data, f, indent=2, ensure_ascii=False)
    
    print(f"[INFO] Referencia guardada en {output_path}")
    print(f"[INFO] Productos procesados: {len(reference_data['products'])}")
    print(f"[INFO] Productos con variedades: {len(reference_data['varieties'])}")
    
    return {
        "output_path": str(output_path),
        "total_products": len(products_list),
        "products_with_varieties": len(reference_data["varieties"]),
        "total_records": int(df.height)
    }


def main():
    """Función principal."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Extrae productos y variedades del dataset MVP"
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/dataset_dashboard_mvp.parquet"),
        help="Ruta al archivo Parquet del dataset MVP"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("dashboard/src/lib/product-variety-reference.json"),
        help="Ruta donde guardar el JSON de referencia"
    )
    
    args = parser.parse_args()
    
    try:
        stats = extract_product_variety_reference(args.input, args.output)
        print("\n[SUCCESS] Extracción completada:")
        print(f"  - Productos: {stats['total_products']}")
        print(f"  - Con variedades: {stats['products_with_varieties']}")
        print(f"  - Total registros: {stats['total_records']:,}")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        raise


if __name__ == "__main__":
    main()

