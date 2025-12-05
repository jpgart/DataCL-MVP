"""
KPI calculation functions.

This module provides:
- Global KPIs: total boxes, kilos, rows, unique counts
- KPIs by dimension: totals filtered by year, country, product, exporter
"""

from typing import Dict, Optional, Union
import polars as pl


def get_total_boxes(df: pl.DataFrame) -> int:
    """
    Calculate total boxes across all records.
    
    Args:
        df: Input DataFrame
    
    Returns:
        Total boxes as integer
    
    Example:
        >>> df = load_data()
        >>> total = get_total_boxes(df)
        >>> print(f"Total boxes: {total:,}")
        Total boxes: 5,144,111,652
    """
    return int(df["boxes"].sum())


def get_total_kilos(df: pl.DataFrame) -> float:
    """
    Calculate total net weight in kilograms across all records.
    
    Args:
        df: Input DataFrame
    
    Returns:
        Total kilos as float
    
    Example:
        >>> df = load_data()
        >>> total = get_total_kilos(df)
        >>> print(f"Total kilos: {total:,.2f}")
        Total kilos: 25,412,581,716.00
    """
    return float(df["net_weight_kg"].sum())


def get_total_rows(df: pl.DataFrame) -> int:
    """
    Get total number of rows in the dataset.
    
    Args:
        df: Input DataFrame
    
    Returns:
        Total row count
    
    Example:
        >>> df = load_data()
        >>> rows = get_total_rows(df)
        >>> print(f"Total rows: {rows:,}")
        Total rows: 1,754,553
    """
    return len(df)


def get_total_exporters(df: pl.DataFrame) -> int:
    """
    Get total number of unique exporters.
    
    Args:
        df: Input DataFrame
    
    Returns:
        Count of unique exporters
    
    Example:
        >>> df = load_data()
        >>> exporters = get_total_exporters(df)
        >>> print(f"Unique exporters: {exporters}")
        Unique exporters: 150
    """
    return df["exporter"].n_unique()


def get_total_products(df: pl.DataFrame) -> int:
    """
    Get total number of unique products.
    
    Args:
        df: Input DataFrame
    
    Returns:
        Count of unique products
    
    Example:
        >>> df = load_data()
        >>> products = get_total_products(df)
        >>> print(f"Unique products: {products}")
        Unique products: 25
    """
    return df["product"].n_unique()


def get_total_countries(df: pl.DataFrame) -> int:
    """
    Get total number of unique countries.
    
    Args:
        df: Input DataFrame
    
    Returns:
        Count of unique countries
    
    Example:
        >>> df = load_data()
        >>> countries = get_total_countries(df)
        >>> print(f"Unique countries: {countries}")
        Unique countries: 50
    """
    return df["country"].n_unique()


def get_total_by_year(df: pl.DataFrame, year: int) -> Dict[str, Union[int, float]]:
    """
    Calculate totals (boxes and kilos) for a specific year.
    
    Args:
        df: Input DataFrame
        year: Year to filter
    
    Returns:
        Dictionary with 'boxes', 'kilos', and 'rows'
    
    Example:
        >>> df = load_data()
        >>> totals_2015 = get_total_by_year(df, 2015)
        >>> print(f"2015: {totals_2015['boxes']:,} boxes")
        2015: 500,000,000 boxes
    """
    df_filtered = df.filter(pl.col("year") == year)
    
    return {
        "boxes": int(df_filtered["boxes"].sum()),
        "kilos": float(df_filtered["net_weight_kg"].sum()),
        "rows": len(df_filtered),
    }


def get_total_by_country(df: pl.DataFrame, country: str) -> Dict[str, Union[int, float]]:
    """
    Calculate totals (boxes and kilos) for a specific country.
    
    Args:
        df: Input DataFrame
        country: Country name (case-sensitive)
    
    Returns:
        Dictionary with 'boxes', 'kilos', and 'rows'
    
    Example:
        >>> df = load_data()
        >>> totals = get_total_by_country(df, "USA")
        >>> print(f"USA: {totals['boxes']:,} boxes")
        USA: 1,000,000,000 boxes
    """
    df_filtered = df.filter(pl.col("country") == country)
    
    return {
        "boxes": int(df_filtered["boxes"].sum()),
        "kilos": float(df_filtered["net_weight_kg"].sum()),
        "rows": len(df_filtered),
    }


def get_total_by_product(df: pl.DataFrame, product: str) -> Dict[str, Union[int, float]]:
    """
    Calculate totals (boxes and kilos) for a specific product.
    
    Args:
        df: Input DataFrame
        product: Product name (case-sensitive)
    
    Returns:
        Dictionary with 'boxes', 'kilos', and 'rows'
    
    Example:
        >>> df = load_data()
        >>> totals = get_total_by_product(df, "Kiwifruit")
        >>> print(f"Kiwifruit: {totals['kilos']:,.2f} kilos")
        Kiwifruit: 500,000,000.00 kilos
    """
    df_filtered = df.filter(pl.col("product") == product)
    
    return {
        "boxes": int(df_filtered["boxes"].sum()),
        "kilos": float(df_filtered["net_weight_kg"].sum()),
        "rows": len(df_filtered),
    }


def get_total_by_exporter(df: pl.DataFrame, exporter: str) -> Dict[str, Union[int, float]]:
    """
    Calculate totals (boxes and kilos) for a specific exporter.
    
    Args:
        df: Input DataFrame
        exporter: Exporter name (case-sensitive)
    
    Returns:
        Dictionary with 'boxes', 'kilos', and 'rows'
    
    Example:
        >>> df = load_data()
        >>> totals = get_total_by_exporter(df, "Copefrut S.A.")
        >>> print(f"Copefrut: {totals['boxes']:,} boxes")
        Copefrut: 100,000,000 boxes
    """
    df_filtered = df.filter(pl.col("exporter") == exporter)
    
    return {
        "boxes": int(df_filtered["boxes"].sum()),
        "kilos": float(df_filtered["net_weight_kg"].sum()),
        "rows": len(df_filtered),
    }

