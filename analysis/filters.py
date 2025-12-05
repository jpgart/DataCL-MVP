"""
Filtering functions for dataset queries.

This module provides functions to filter the dataset by:
- Year (single or range)
- Country
- Exporter
- Product
- Season
"""

from typing import Optional
import polars as pl


def filter_by_year(df: pl.DataFrame, year: int) -> pl.DataFrame:
    """
    Filter dataset by a specific year.
    
    Args:
        df: Input DataFrame
        year: Year to filter
    
    Returns:
        Filtered DataFrame
    
    Example:
        >>> df = load_data()
        >>> df_2015 = filter_by_year(df, 2015)
        >>> print(f"Rows in 2015: {len(df_2015):,}")
        Rows in 2015: 150,000
    """
    return df.filter(pl.col("year") == year)


def filter_by_range_years(df: pl.DataFrame, start_year: int, end_year: int) -> pl.DataFrame:
    """
    Filter dataset by a range of years (inclusive).
    
    Args:
        df: Input DataFrame
        start_year: Start year (inclusive)
        end_year: End year (inclusive)
    
    Returns:
        Filtered DataFrame
    
    Example:
        >>> df = load_data()
        >>> df_2015_2020 = filter_by_range_years(df, 2015, 2020)
        >>> print(f"Rows 2015-2020: {len(df_2015_2020):,}")
        Rows 2015-2020: 900,000
    """
    return df.filter(
        (pl.col("year") >= start_year) & (pl.col("year") <= end_year)
    )


def filter_by_country(df: pl.DataFrame, country: str) -> pl.DataFrame:
    """
    Filter dataset by a specific country.
    
    Args:
        df: Input DataFrame
        country: Country name (case-sensitive)
    
    Returns:
        Filtered DataFrame
    
    Example:
        >>> df = load_data()
        >>> df_usa = filter_by_country(df, "USA")
        >>> print(f"USA rows: {len(df_usa):,}")
        USA rows: 200,000
    """
    return df.filter(pl.col("country") == country)


def filter_by_exporter(df: pl.DataFrame, exporter: str) -> pl.DataFrame:
    """
    Filter dataset by a specific exporter.
    
    Args:
        df: Input DataFrame
        exporter: Exporter name (case-sensitive)
    
    Returns:
        Filtered DataFrame
    
    Example:
        >>> df = load_data()
        >>> df_copefrut = filter_by_exporter(df, "Copefrut S.A.")
        >>> print(f"Copefrut rows: {len(df_copefrut):,}")
        Copefrut rows: 50,000
    """
    return df.filter(pl.col("exporter") == exporter)


def filter_by_product(df: pl.DataFrame, product: str) -> pl.DataFrame:
    """
    Filter dataset by a specific product.
    
    Args:
        df: Input DataFrame
        product: Product name (case-sensitive)
    
    Returns:
        Filtered DataFrame
    
    Example:
        >>> df = load_data()
        >>> df_kiwi = filter_by_product(df, "Kiwifruit")
        >>> print(f"Kiwifruit rows: {len(df_kiwi):,}")
        Kiwifruit rows: 300,000
    """
    return df.filter(pl.col("product") == product)


def filter_by_season(df: pl.DataFrame, season: str) -> pl.DataFrame:
    """
    Filter dataset by a specific season.
    
    Args:
        df: Input DataFrame
        season: Season string (e.g., "2010-2011")
    
    Returns:
        Filtered DataFrame
    
    Example:
        >>> df = load_data()
        >>> df_season = filter_by_season(df, "2015-2016")
        >>> print(f"Season rows: {len(df_season):,}")
        Season rows: 175,000
    """
    return df.filter(pl.col("season") == season)


