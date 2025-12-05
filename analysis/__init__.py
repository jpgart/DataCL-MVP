"""
Analysis module for DataCL project.

This module provides a complete set of analysis functions for the exports dataset:
- Data loading with schema enforcement
- KPI calculations
- Top N rankings
- Filtering functions
- Time series analysis
"""

from .loader import (
    load_data,
    get_unique_values,
    get_years,
    get_countries,
    get_products,
    get_exporters,
    get_seasons,
)

from .kpis import (
    get_total_boxes,
    get_total_kilos,
    get_total_rows,
    get_total_exporters,
    get_total_products,
    get_total_countries,
    get_total_by_year,
    get_total_by_country,
    get_total_by_product,
    get_total_by_exporter,
)

from .filters import (
    filter_by_year,
    filter_by_range_years,
    filter_by_country,
    filter_by_exporter,
    filter_by_product,
    filter_by_season,
)

from .top_n import (
    top_products,
    top_countries,
    top_exporters,
    top_products_by_country,
    top_countries_by_product,
)

from .timeseries import (
    time_series_total,
    time_series_by_country,
    time_series_by_product,
    time_series_by_exporter,
)

__all__ = [
    # Loader
    "load_data",
    "get_unique_values",
    "get_years",
    "get_countries",
    "get_products",
    "get_exporters",
    "get_seasons",
    # KPIs
    "get_total_boxes",
    "get_total_kilos",
    "get_total_rows",
    "get_total_exporters",
    "get_total_products",
    "get_total_countries",
    "get_total_by_year",
    "get_total_by_country",
    "get_total_by_product",
    "get_total_by_exporter",
    # Filters
    "filter_by_year",
    "filter_by_range_years",
    "filter_by_country",
    "filter_by_exporter",
    "filter_by_product",
    "filter_by_season",
    # Top N
    "top_products",
    "top_countries",
    "top_exporters",
    "top_products_by_country",
    "top_countries_by_product",
    # Time series
    "time_series_total",
    "time_series_by_country",
    "time_series_by_product",
    "time_series_by_exporter",
]


