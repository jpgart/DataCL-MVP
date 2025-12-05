"""
Data loader module with schema enforcement and caching.

This module provides:
- load_data(): Load and cache the cleaned dataset
- Helper functions to get unique values from columns
"""

from pathlib import Path
from typing import List, Optional
import polars as pl
from .utils import ensure_columns, validate_types


# Global cache for loaded data
_cached_df: Optional[pl.DataFrame] = None

# Expected schema for analysis (only core columns)
EXPECTED_SCHEMA = {
    "season": "str",
    "week": "int",
    "year": "int",
    "country": "str",
    "product": "str",
    "exporter": "str",
    "port_destination": "str",
    "boxes": "int",
    "net_weight_kg": "float",
}


def load_data(force_reload: bool = False) -> pl.DataFrame:
    """
    Load the cleaned dataset with schema enforcement and caching.
    
    Args:
        force_reload: If True, reload data even if cached
    
    Returns:
        Polars DataFrame with enforced schema
    
    Example:
        >>> df = load_data()
        >>> print(df.shape)
        (1754553, 9)
    """
    global _cached_df
    
    if _cached_df is not None and not force_reload:
        return _cached_df
    
    # Get project root (parent of analysis directory)
    project_root = Path(__file__).parent.parent
    parquet_path = project_root / "data" / "exports_10_years_clean.parquet"
    
    if not parquet_path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {parquet_path}\n"
            "Please ensure exports_10_years_clean.parquet exists in the data/ directory."
        )
    
    # Load data
    df = pl.read_parquet(parquet_path)
    
    # Enforce schema (select only expected columns and cast types)
    df = ensure_columns(df, EXPECTED_SCHEMA)
    
    # Validate types
    if not validate_types(df, EXPECTED_SCHEMA):
        raise ValueError("Schema validation failed after type casting")
    
    # Cache the result
    _cached_df = df
    
    return df


def get_unique_values(column: str, df: Optional[pl.DataFrame] = None) -> List[str]:
    """
    Get unique values from a column, sorted alphabetically.
    
    Args:
        column: Column name
        df: DataFrame (if None, uses cached data)
    
    Returns:
        List of unique values, sorted
    
    Example:
        >>> countries = get_unique_values("country")
        >>> print(len(countries))
        50
    """
    if df is None:
        df = load_data()
    
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found in dataset")
    
    return sorted(df[column].unique().to_list())


def get_years(df: Optional[pl.DataFrame] = None) -> List[int]:
    """
    Get unique years from the dataset, sorted.
    
    Args:
        df: DataFrame (if None, uses cached data)
    
    Returns:
        List of unique years, sorted
    
    Example:
        >>> years = get_years()
        >>> print(f"Years: {min(years)}-{max(years)}")
        Years: 2010-2020
    """
    if df is None:
        df = load_data()
    
    return sorted(df["year"].unique().to_list())


def get_countries(df: Optional[pl.DataFrame] = None) -> List[str]:
    """
    Get unique countries from the dataset, sorted.
    
    Args:
        df: DataFrame (if None, uses cached data)
    
    Returns:
        List of unique countries, sorted
    
    Example:
        >>> countries = get_countries()
        >>> print(f"Total countries: {len(countries)}")
        Total countries: 50
    """
    return get_unique_values("country", df)


def get_products(df: Optional[pl.DataFrame] = None) -> List[str]:
    """
    Get unique products from the dataset, sorted.
    
    Args:
        df: DataFrame (if None, uses cached data)
    
    Returns:
        List of unique products, sorted
    
    Example:
        >>> products = get_products()
        >>> print(f"Total products: {len(products)}")
        Total products: 25
    """
    return get_unique_values("product", df)


def get_exporters(df: Optional[pl.DataFrame] = None) -> List[str]:
    """
    Get unique exporters from the dataset, sorted.
    
    Args:
        df: DataFrame (if None, uses cached data)
    
    Returns:
        List of unique exporters, sorted
    
    Example:
        >>> exporters = get_exporters()
        >>> print(f"Total exporters: {len(exporters)}")
        Total exporters: 150
    """
    return get_unique_values("exporter", df)


def get_seasons(df: Optional[pl.DataFrame] = None) -> List[str]:
    """
    Get unique seasons from the dataset, sorted.
    
    Args:
        df: DataFrame (if None, uses cached data)
    
    Returns:
        List of unique seasons, sorted
    
    Example:
        >>> seasons = get_seasons()
        >>> print(f"Total seasons: {len(seasons)}")
        Total seasons: 10
    """
    return get_unique_values("season", df)


