"""
Top N ranking functions.

This module provides functions to get top rankings by:
- Products (by boxes or kilos)
- Countries (by boxes or kilos)
- Exporters (by boxes or kilos)
- Products by country
- Countries by product
"""

from typing import Optional
import polars as pl


def top_products(df: pl.DataFrame, year: Optional[int] = None, n: int = 10) -> pl.DataFrame:
    """
    Get top N products by total boxes and kilos.
    
    Args:
        df: Input DataFrame
        year: Optional year filter (if None, uses all data)
        n: Number of top products to return
    
    Returns:
        DataFrame with columns: product, boxes, net_weight_kg
        Sorted by boxes descending
    
    Example:
        >>> df = load_data()
        >>> top = top_products(df, year=2015, n=5)
        >>> print(top)
        shape: (5, 3)
        ┌─────────────┬─────────┬──────────────┐
        │ product     │ boxes   │ net_weight_kg │
        ├─────────────┼─────────┼──────────────┤
        │ Kiwifruit   │ 5000000 │ 25000000.0   │
        │ ...
    """
    df_filtered = df if year is None else df.filter(pl.col("year") == year)
    
    return (
        df_filtered
        .group_by("product")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("boxes", descending=True)
        .head(n)
    )


def top_countries(df: pl.DataFrame, year: Optional[int] = None, n: int = 10) -> pl.DataFrame:
    """
    Get top N countries by total boxes and kilos.
    
    Args:
        df: Input DataFrame
        year: Optional year filter (if None, uses all data)
        n: Number of top countries to return
    
    Returns:
        DataFrame with columns: country, boxes, net_weight_kg
        Sorted by boxes descending
    
    Example:
        >>> df = load_data()
        >>> top = top_countries(df, n=5)
        >>> print(top)
        shape: (5, 3)
        ┌─────────┬─────────┬──────────────┐
        │ country │ boxes   │ net_weight_kg │
        ├─────────┼─────────┼──────────────┤
        │ USA     │ 1000000 │ 5000000.0    │
        │ ...
    """
    df_filtered = df if year is None else df.filter(pl.col("year") == year)
    
    return (
        df_filtered
        .group_by("country")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("boxes", descending=True)
        .head(n)
    )


def top_exporters(df: pl.DataFrame, year: Optional[int] = None, n: int = 10) -> pl.DataFrame:
    """
    Get top N exporters by total boxes and kilos.
    
    Args:
        df: Input DataFrame
        year: Optional year filter (if None, uses all data)
        n: Number of top exporters to return
    
    Returns:
        DataFrame with columns: exporter, boxes, net_weight_kg
        Sorted by boxes descending
    
    Example:
        >>> df = load_data()
        >>> top = top_exporters(df, year=2015, n=5)
        >>> print(top)
        shape: (5, 3)
        ┌───────────────┬─────────┬──────────────┐
        │ exporter      │ boxes   │ net_weight_kg │
        ├───────────────┼─────────┼──────────────┤
        │ Copefrut S.A. │ 500000  │ 2500000.0    │
        │ ...
    """
    df_filtered = df if year is None else df.filter(pl.col("year") == year)
    
    return (
        df_filtered
        .group_by("exporter")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("boxes", descending=True)
        .head(n)
    )


def top_products_by_country(df: pl.DataFrame, country: str, n: int = 10) -> pl.DataFrame:
    """
    Get top N products for a specific country.
    
    Args:
        df: Input DataFrame
        country: Country name (case-sensitive)
        n: Number of top products to return
    
    Returns:
        DataFrame with columns: product, boxes, net_weight_kg
        Sorted by boxes descending
    
    Example:
        >>> df = load_data()
        >>> top = top_products_by_country(df, "USA", n=5)
        >>> print(top)
        shape: (5, 3)
        ┌─────────────┬─────────┬──────────────┐
        │ product     │ boxes   │ net_weight_kg │
        ├─────────────┼─────────┼──────────────┤
        │ Kiwifruit   │ 200000  │ 1000000.0    │
        │ ...
    """
    return (
        df
        .filter(pl.col("country") == country)
        .group_by("product")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("boxes", descending=True)
        .head(n)
    )


def top_countries_by_product(df: pl.DataFrame, product: str, n: int = 10) -> pl.DataFrame:
    """
    Get top N countries for a specific product.
    
    Args:
        df: Input DataFrame
        product: Product name (case-sensitive)
        n: Number of top countries to return
    
    Returns:
        DataFrame with columns: country, boxes, net_weight_kg
        Sorted by boxes descending
    
    Example:
        >>> df = load_data()
        >>> top = top_countries_by_product(df, "Kiwifruit", n=5)
        >>> print(top)
        shape: (5, 3)
        ┌─────────┬─────────┬──────────────┐
        │ country │ boxes   │ net_weight_kg │
        ├─────────┼─────────┼──────────────┤
        │ USA     │ 300000  │ 1500000.0    │
        │ ...
    """
    return (
        df
        .filter(pl.col("product") == product)
        .group_by("country")
        .agg([
            pl.col("boxes").sum().alias("boxes"),
            pl.col("net_weight_kg").sum().alias("net_weight_kg"),
        ])
        .sort("boxes", descending=True)
        .head(n)
    )


