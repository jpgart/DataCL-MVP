#!/usr/bin/env python3
"""
Script para enriquecer el JSON de referencias con traducciones ES/EN
basándose en conocimiento del dominio y sinónimos comunes.
"""

import json
from pathlib import Path
from typing import Dict, List

# Mapeo de traducciones y sinónimos para productos principales
PRODUCT_TRANSLATIONS: Dict[str, Dict[str, List[str]]] = {
    "table_grape": {
        "en": ["Table Grape", "Grapes", "Grape", "Table Grapes", "Fresh Grapes"],
        "es": ["Uva", "Uvas", "Uva de mesa", "Uvas de mesa", "Uva fresca"]
    },
    "blueberries": {
        "en": ["Blueberries", "Blueberry"],
        "es": ["Arándanos", "Arándano"]
    },
    "avocados": {
        "en": ["Avocados", "Avocado"],
        "es": ["Paltas", "Palta", "Aguacates", "Aguacate"]
    },
    "apples": {
        "en": ["Apples", "Apple"],
        "es": ["Manzanas", "Manzana"]
    },
    "cherries": {
        "en": ["Cherries", "Cherry"],
        "es": ["Cerezas", "Cereza"]
    },
    "kiwifruit": {
        "en": ["Kiwifruit", "Kiwi", "Kiwis"],
        "es": ["Kiwi", "Kiwis"]
    },
    "clementine": {
        "en": ["Clementine", "Clementines"],
        "es": ["Clementina", "Clementinas"]
    },
    "oranges": {
        "en": ["Oranges", "Orange"],
        "es": ["Naranjas", "Naranja"]
    },
    "mandarins": {
        "en": ["Mandarins", "Mandarin"],
        "es": ["Mandarinas", "Mandarina"]
    },
    "lemons": {
        "en": ["Lemons", "Lemon"],
        "es": ["Limones", "Limón"]
    },
    "pear": {
        "en": ["Pear", "Pears"],
        "es": ["Pera", "Peras"]
    },
    "peach": {
        "en": ["Peach", "Peaches"],
        "es": ["Durazno", "Duraznos", "Melocotón", "Melocotones"]
    },
    "plum": {
        "en": ["Plum", "Plums"],
        "es": ["Ciruela", "Ciruelas"]
    },
    "nectarines": {
        "en": ["Nectarines", "Nectarine"],
        "es": ["Nectarina", "Nectarinas"]
    },
    "apricot": {
        "en": ["Apricot", "Apricots"],
        "es": ["Albaricoque", "Albaricoques", "Damasco", "Damasco"]
    },
    "walnuts": {
        "en": ["Walnuts", "Walnut"],
        "es": ["Nueces", "Nuez", "Nuez de nogal"]
    },
    "almonds": {
        "en": ["Almonds", "Almond"],
        "es": ["Almendras", "Almendra"]
    },
    "hazelnut": {
        "en": ["Hazelnuts", "Hazelnut"],
        "es": ["Avellanas", "Avellana"]
    },
    "chestnuts": {
        "en": ["Chestnuts", "Chestnut"],
        "es": ["Castañas", "Castaña"]
    },
    "onions": {
        "en": ["Onions", "Onion"],
        "es": ["Cebollas", "Cebolla"]
    },
    "garlic": {
        "en": ["Garlic"],
        "es": ["Ajo"]
    },
    "strawberries": {
        "en": ["Strawberries", "Strawberry"],
        "es": ["Fresas", "Fresa", "Frutillas", "Frutilla"]
    },
    "raspberries": {
        "en": ["Raspberries", "Raspberry"],
        "es": ["Frambuesas", "Frambuesa"]
    },
    "blackberries": {
        "en": ["Blackberries", "Blackberry"],
        "es": ["Moras", "Mora"]
    },
    "grapefruit": {
        "en": ["Grapefruit"],
        "es": ["Pomelo", "Toronja"]
    },
    "lime": {
        "en": ["Lime", "Limes"],
        "es": ["Lima", "Limas"]
    },
    "mangoes": {
        "en": ["Mangoes", "Mango", "Mangos"],
        "es": ["Mangos", "Mango"]
    },
    "pineapple": {
        "en": ["Pineapple", "Pineapples"],
        "es": ["Piña", "Piñas", "Ananá", "Ananás"]
    },
    "pomegranate": {
        "en": ["Pomegranate", "Pomegranates"],
        "es": ["Granada", "Granadas"]
    },
    "figs": {
        "en": ["Figs", "Fig"],
        "es": ["Higos", "Higo"]
    },
    "persimmons": {
        "en": ["Persimmons", "Persimmon"],
        "es": ["Caqui", "Caquis", "Kaki", "Kakis"]
    },
    "papayas": {
        "en": ["Papayas", "Papaya"],
        "es": ["Papayas", "Papaya"]
    },
    "cherimoya": {
        "en": ["Cherimoya", "Cherimoyas"],
        "es": ["Chirimoya", "Chirimoyas"]
    },
    "cranberries": {
        "en": ["Cranberries", "Cranberry"],
        "es": ["Arándanos rojos", "Arándano rojo"]
    },
    "quince": {
        "en": ["Quince", "Quinces"],
        "es": ["Membrillo", "Membrillos"]
    }
}

# Descripciones mejoradas
PRODUCT_DESCRIPTIONS: Dict[str, Dict[str, str]] = {
    "table_grape": {
        "en": "Fresh table grapes for export (red, green, or black, with or without seeds)",
        "es": "Uvas de mesa frescas para exportación (rojas, verdes o negras, con o sin semilla)"
    },
    "blueberries": {
        "en": "Fresh blueberries for export",
        "es": "Arándanos frescos para exportación"
    },
    "avocados": {
        "en": "Fresh avocados for export",
        "es": "Paltas o aguacates frescos para exportación"
    },
    "apples": {
        "en": "Fresh apples for export",
        "es": "Manzanas frescas para exportación"
    },
    "cherries": {
        "en": "Fresh cherries for export",
        "es": "Cerezas frescas para exportación"
    },
    "kiwifruit": {
        "en": "Fresh kiwifruit for export",
        "es": "Kiwi fresco para exportación"
    },
    "clementine": {
        "en": "Fresh clementines for export (citrus similar to mandarin)",
        "es": "Clementinas frescas para exportación (cítrico similar a mandarina)"
    },
    "oranges": {
        "en": "Fresh oranges for export",
        "es": "Naranjas frescas para exportación"
    }
}


def enrich_reference(input_path: Path, output_path: Path) -> None:
    """
    Enriquece el JSON de referencia con traducciones y descripciones mejoradas.
    """
    print(f"[INFO] Leyendo referencia desde {input_path}")
    
    with input_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    products = data.get("products", {})
    enriched_count = 0
    
    print(f"[INFO] Enriqueciendo {len(products)} productos...")
    
    for product_id, product_data in products.items():
        canonical_name = product_data.get("canonical_name", "")
        
        # Aplicar traducciones si existen
        if product_id in PRODUCT_TRANSLATIONS:
            translations = PRODUCT_TRANSLATIONS[product_id]
            product_data["names"]["en"] = list(set(
                product_data["names"]["en"] + translations["en"]
            ))
            product_data["names"]["es"] = list(set(
                product_data["names"]["es"] + translations["es"]
            ))
            enriched_count += 1
        
        # Aplicar descripciones mejoradas si existen
        if product_id in PRODUCT_DESCRIPTIONS:
            product_data["description"] = PRODUCT_DESCRIPTIONS[product_id]
        
        # Asegurar que el nombre canónico esté en los matches
        if canonical_name not in product_data["dataset_matches"]:
            product_data["dataset_matches"].insert(0, canonical_name)
    
    # Guardar JSON enriquecido
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"[INFO] Referencia enriquecida guardada en {output_path}")
    print(f"[INFO] Productos enriquecidos: {enriched_count}/{len(products)}")


def main():
    """Función principal."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Enriquece el JSON de referencia con traducciones ES/EN"
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("dashboard/src/lib/product-variety-reference.json"),
        help="Ruta al JSON de referencia original"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("dashboard/src/lib/product-variety-reference.json"),
        help="Ruta donde guardar el JSON enriquecido (puede ser el mismo)"
    )
    
    args = parser.parse_args()
    
    try:
        enrich_reference(args.input, args.output)
        print("\n[SUCCESS] Enriquecimiento completado")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        raise


if __name__ == "__main__":
    main()

