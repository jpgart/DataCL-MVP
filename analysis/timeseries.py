"""
Time series analysis functions.

This module provides functions to generate time series data aggregated by year:
- Total time series
- Time series by country
- Time series by product
- Time series by exporter
"""

import polars as pl


def time_series_total(df: pl.DataFrame) -> pl.DataFrame:
    """
    Generate time series of total boxes and kilos aggregated by year.
    
    Args:
        df: Input DataFrame
    
    Returns:
        DataFrame with columns: year, boxes, net_weight_kg
        Sorted by year ascending
    
    Example:
        >>> df = load_data()
        >>> ts = time_series_total(df)
        >>> print(ts)
        shape: (11, 3)
        ┌──────┬─────────┬──────────────┐
        │ year │ boxes   │ net_weight_kg │
        ├──────┼─────────┼──────────────┤
        │ 2010 │ 400000  │ 2000000.0    │
        │ 2011 │ 450000  │ 2250000.0    │
        │ ...
    """
    return (
        df
        .group_by("year")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("year")
    )


def time_series_by_country(df: pl.DataFrame, country: str) -> pl.DataFrame:
    """
    Generate time series of boxes and kilos for a specific country, aggregated by year.
    
    Args:
        df: Input DataFrame
        country: Country name (case-sensitive)
    
    Returns:
        DataFrame with columns: year, boxes, net_weight_kg
        Sorted by year ascending
    
    Example:
        >>> df = load_data()
        >>> ts = time_series_by_country(df, "USA")
        >>> print(ts)
        shape: (11, 3)
        ┌──────┬─────────┬──────────────┐
        │ year │ boxes   │ net_weight_kg │
        ├──────┼─────────┼──────────────┤
        │ 2010 │ 50000   │ 250000.0     │
        │ 2011 │ 55000   │ 275000.0     │
        │ ...
    """
    return (
        df
        .filter(pl.col("country") == country)
        .group_by("year")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("year")
    )


def time_series_by_product(df: pl.DataFrame, product: str) -> pl.DataFrame:
    """
    Generate time series of boxes and kilos for a specific product, aggregated by year.
    
    Args:
        df: Input DataFrame
        product: Product name (case-sensitive)
    
    Returns:
        DataFrame with columns: year, boxes, net_weight_kg
        Sorted by year ascending
    
    Example:
        >>> df = load_data()
        >>> ts = time_series_by_product(df, "Kiwifruit")
        >>> print(ts)
        shape: (11, 3)
        ┌──────┬─────────┬──────────────┐
        │ year │ boxes   │ net_weight_kg │
        ├──────┼─────────┼──────────────┤
        │ 2010 │ 60000   │ 300000.0     │
        │ 2011 │ 65000   │ 325000.0     │
        │ ...
    """
    return (
        df
        .filter(pl.col("product") == product)
        .group_by("year")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("year")
    )


def time_series_by_exporter(df: pl.DataFrame, exporter: str) -> pl.DataFrame:
    """
    Generate time series of boxes and kilos for a specific exporter, aggregated by year.
    
    Args:
        df: Input DataFrame
        exporter: Exporter name (case-sensitive)
    
    Returns:
        DataFrame with columns: year, boxes, net_weight_kg
        Sorted by year ascending
    
    Example:
        >>> df = load_data()
        >>> ts = time_series_by_exporter(df, "Copefrut S.A.")
        >>> print(ts)
        shape: (11, 3)
        ┌──────┬─────────┬──────────────┐
        │ year │ boxes   │ net_weight_kg │
        ├──────┼─────────┼──────────────┤
        │ 2010 │ 30000   │ 150000.0     │
        │ 2011 │ 35000   │ 175000.0     │
        │ ...
    """
    return (
        df
        .filter(pl.col("exporter") == exporter)
        .group_by("year")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("year")
    )


