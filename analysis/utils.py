"""
Utility functions for data validation and type conversion.

This module provides helper functions for:
- Schema validation
- Type casting with error handling
- String cleaning
- Number formatting
"""

from typing import Dict, Any, Optional, Union
import polars as pl


def ensure_columns(df: pl.DataFrame, expected_schema: Dict[str, str]) -> pl.DataFrame:
    """
    Ensure DataFrame has all required columns with correct types.
    
    Args:
        df: Input Polars DataFrame
        expected_schema: Dictionary mapping column names to expected types
            e.g., {"season": "str", "week": "int", "boxes": "int"}
    
    Returns:
        DataFrame with only the expected columns in the correct order
    
    Raises:
        ValueError: If required columns are missing
    
    Example:
        >>> schema = {"season": "str", "week": "int", "boxes": "int"}
        >>> df_clean = ensure_columns(df, schema)
    """
    missing_cols = set(expected_schema.keys()) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    # Select only expected columns in order
    df_selected = df.select(list(expected_schema.keys()))
    
    # Cast types
    type_mapping = {
        "str": pl.Utf8,
        "int": pl.Int64,
        "float": pl.Float64,
    }
    
    casts = []
    for col, expected_type in expected_schema.items():
        polars_type = type_mapping.get(expected_type)
        if polars_type and df_selected[col].dtype != polars_type:
            casts.append(pl.col(col).cast(polars_type))
    
    if casts:
        df_selected = df_selected.with_columns(casts)
    
    return df_selected


def clean_string(x: Optional[str]) -> str:
    """
    Clean string value: strip whitespace and apply title case.
    
    Args:
        x: Input string (can be None)
    
    Returns:
        Cleaned string, or empty string if None
    
    Example:
        >>> clean_string("  hello world  ")
        'Hello World'
        >>> clean_string(None)
        ''
    """
    if x is None:
        return ""
    return str(x).strip().title()


def safe_int_cast(x: Any, default: int = 0) -> int:
    """
    Safely cast value to integer.
    
    Args:
        x: Value to cast
        default: Default value if casting fails
    
    Returns:
        Integer value or default
    
    Example:
        >>> safe_int_cast("123")
        123
        >>> safe_int_cast("invalid", default=0)
        0
    """
    try:
        if isinstance(x, str):
            # Remove thousand separators
            x = x.replace(".", "").replace(",", "")
        return int(float(x))
    except (ValueError, TypeError):
        return default


def safe_float_cast(x: Any, default: float = 0.0) -> float:
    """
    Safely cast value to float.
    
    Args:
        x: Value to cast
        default: Default value if casting fails
    
    Returns:
        Float value or default
    
    Example:
        >>> safe_float_cast("123.45")
        123.45
        >>> safe_float_cast("invalid", default=0.0)
        0.0
    """
    try:
        if isinstance(x, str):
            # Remove thousand separators
            x = x.replace(".", "").replace(",", "")
        return float(x)
    except (ValueError, TypeError):
        return default


def remove_thousand_sep(x: Union[str, int, float]) -> str:
    """
    Remove thousand separators from number string.
    
    Args:
        x: Number as string, int, or float
    
    Returns:
        String without thousand separators
    
    Example:
        >>> remove_thousand_sep("1.234.567")
        '1234567'
        >>> remove_thousand_sep("1,234,567")
        '1234567'
    """
    if isinstance(x, (int, float)):
        x = str(x)
    return str(x).replace(".", "").replace(",", "")


def validate_types(df: pl.DataFrame, expected_schema: Dict[str, str]) -> bool:
    """
    Validate that DataFrame columns match expected types.
    
    Args:
        df: Input DataFrame
        expected_schema: Dictionary mapping column names to expected types
    
    Returns:
        True if all types match, False otherwise
    
    Example:
        >>> schema = {"week": "int", "boxes": "int"}
        >>> is_valid = validate_types(df, schema)
    """
    type_mapping = {
        "str": (pl.Utf8,),
        "int": (pl.Int64, pl.Int32, pl.Int16, pl.Int8),
        "float": (pl.Float64, pl.Float32),
    }
    
    for col, expected_type in expected_schema.items():
        if col not in df.columns:
            return False
        
        polars_types = type_mapping.get(expected_type, ())
        if df[col].dtype not in polars_types:
            return False
    
    return True


