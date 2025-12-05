#!/usr/bin/env python3
"""
Genera un dataset reducido (MVP) filtrando temporadas específicas del archivo dashboard ready.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List, Optional

import polars as pl


DEFAULT_INPUT_PATH = Path("data/dataset_dashboard_ready.parquet")
DEFAULT_OUTPUT_PATH = Path("data/dataset_dashboard_mvp.parquet")
DEFAULT_METRICS_PATH = Path("data/dataset_dashboard_mvp_metrics.json")
DEFAULT_SEASONS = [
	"2024-2025",
	"2023-2024",
	"2022-2023",
]


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Generar dataset MVP filtrando temporadas específicas.")
	parser.add_argument(
		"--input",
		type=Path,
		default=DEFAULT_INPUT_PATH,
		help=f"Ruta del parquet de entrada (default: {DEFAULT_INPUT_PATH})",
	)
	parser.add_argument(
		"--output",
		type=Path,
		default=DEFAULT_OUTPUT_PATH,
		help=f"Ruta del parquet resultante (default: {DEFAULT_OUTPUT_PATH})",
	)
	parser.add_argument(
		"--metrics",
		type=Path,
		default=DEFAULT_METRICS_PATH,
		help=f"Ruta opcional para guardar métricas en JSON (default: {DEFAULT_METRICS_PATH})",
	)
	parser.add_argument(
		"--seasons",
		type=str,
		default=",".join(DEFAULT_SEASONS),
		help="Lista de temporadas separadas por coma. Ej: 2024-2025,2023-2024",
	)
	return parser.parse_args()


def create_mvp_dataset(
	input_path: Path,
	output_path: Path,
	seasons: List[str],
	metrics_path: Optional[Path] = None,
) -> dict:
	if not input_path.exists():
		raise FileNotFoundError(f"No se encontró el archivo de entrada: {input_path}")

	if not seasons:
		raise ValueError("Debe especificar al menos una temporada para filtrar.")

	print(f"[INFO] Leyendo dataset desde {input_path}")
	print(f"[INFO] Temporadas objetivo: {seasons}")

	lf = pl.scan_parquet(str(input_path))
	filtered = lf.filter(pl.col("season").is_in(seasons))
	df = filtered.collect()

	if df.height == 0:
		raise RuntimeError("El filtro no devolvió registros. Verifica que las temporadas existan en el dataset.")

	output_path.parent.mkdir(parents=True, exist_ok=True)
	df.write_parquet(str(output_path), compression="snappy")

	stats = {
		"input_path": str(input_path),
		"output_path": str(output_path),
		"row_count": df.height,
		"season_count": df.select(pl.col("season").n_unique()).item(),
		"seasons_found": sorted(df.select("season").unique().to_series().to_list()),
		"total_boxes": int(df.select(pl.col("boxes").sum()).item()),
		"total_net_weight_kg": float(df.select(pl.col("net_weight_kg").sum()).item()),
	}

	print("[INFO] Dataset MVP generado correctamente:")
	print(
		f"- Registros: {stats['row_count']}\n"
		f"- Temporadas detectadas: {stats['season_count']} ({stats['seasons_found']})\n"
		f"- Total boxes: {stats['total_boxes']:,}\n"
		f"- Total net_weight_kg: {stats['total_net_weight_kg']:,}"
	)

	if metrics_path:
		metrics_path.parent.mkdir(parents=True, exist_ok=True)
		with metrics_path.open("w", encoding="utf-8") as fp:
			json.dump(stats, fp, indent=2)
		print(f"[INFO] Métricas guardadas en {metrics_path}")

	return stats


def main() -> None:
	args = parse_args()
	seasons = [season.strip() for season in args.seasons.split(",") if season.strip()]
	create_mvp_dataset(args.input, args.output, seasons, args.metrics)


if __name__ == "__main__":
	main()

