import polars as pl

def procesar_dataset_maestro(file_path, output_path="data/dataset_dashboard_ready.parquet"):
    """
    MOTOR DE TRANSFORMACIÓN DE DATOS (ETL)
    Autor: Me-Vi
    
    Este script aplica las reglas de negocio definidas en el Plan Maestro:
    1. Ordenamiento Temporal Estricto (Season Sort).
    2. Creación de Índice de Semana Absoluta (para gráficos continuos).
    3. Normalización de Entidades.
    4. Cálculo de Métricas Base (Peso Unitario).
    """
    print(f"--- [ETL] INICIANDO PROCESAMIENTO: {file_path} ---")
    
    # 1. CARGA Y LIMPIEZA INICIAL
    try:
        df = pl.read_parquet(file_path)
    except:
        print("Error crítico: No se encontró el archivo.")
        return

    # Normalizar columnas a minúsculas y strip (si es necesario)
    # Nota: El dataset ya viene con columnas en minúsculas, pero mantenemos esto por seguridad
    df = df.rename({col: col.lower().strip() for col in df.columns})
    
    # Limpieza de Strings (Evita duplicados en Rankings)
    cols_texto = ['variety', 'importer', 'exporter', 'market', 'region']
    for col in cols_texto:
        if col in df.columns:
            df = df.with_columns(
                pl.col(col).str.strip_chars().str.to_titlecase().alias(col)
            )

    # 2. LÓGICA TEMPORAL (EL CORAZÓN DEL ORDENAMIENTO)
    print("--- [ETL] Aplicando Lógica de Temporada (Season Sort) ---")
    
    # Extraer inicio y fin de temporada del string "2024-2025"
    if 'season' in df.columns:
        df = df.with_columns([
            pl.col("season").str.split("-").list.get(0).cast(pl.Int32).alias("season_start_year"),
            pl.col("season").str.split("-").list.get(1).cast(pl.Int32).alias("season_end_year")
        ])

    # CREACIÓN DE "ABSOLUTE SEASON WEEK"
    # Lógica: Si la temporada empieza aprox en semana 35:
    # - Semanas 35 a 53 del año 1 -> Índices 1 a 19
    # - Semanas 1 a 34 del año 2 -> Índices 20 a 53
    # Esto permite que al graficar, enero aparezca DESPUÉS de diciembre.
    
    SPLIT_WEEK = 35 # Semana de inicio de temporada (basado en análisis de datos reales)
    
    df = df.with_columns(
        pl.when(pl.col("week") >= SPLIT_WEEK)
        .then(pl.col("week") - SPLIT_WEEK + 1) # Ej: Sem 35 -> Indice 1, Sem 53 -> Indice 19
        .otherwise(pl.col("week") + (53 - SPLIT_WEEK) + 1) # Ej: Sem 1 -> Indice 20, Sem 34 -> Indice 53
        .alias("absolute_season_week")
    )
    
    # 3. CÁLCULO DE MÉTRICAS DERIVADAS
    print("--- [ETL] Calculando Métricas Derivadas ---")
    
    if 'boxes' in df.columns and 'net_weight_kg' in df.columns:
        df = df.with_columns([
            # Unit Weight (para detección de anomalías en gráficos)
            (pl.col("net_weight_kg") / pl.col("boxes")).fill_nan(0).alias("unit_weight_kg"),
            
            # Flag de Outlier (Regla simple: < 1kg o > 25kg por caja)
            pl.when((pl.col("net_weight_kg") / pl.col("boxes") < 1) | 
                    (pl.col("net_weight_kg") / pl.col("boxes") > 25))
              .then(True)
              .otherwise(False)
              .alias("is_data_outlier")
        ])

    # 4. ORDENAMIENTO FINAL FÍSICO
    # Importante para que los gráficos de línea salgan ordenados por defecto
    df = df.sort(["season", "absolute_season_week"])

    # 5. EXPORTACIÓN
    print(f"--- [ETL] Exportando Dataset Maestro ({df.shape[0]} filas) ---")
    # Usar compresión "snappy" para compatibilidad con parquetjs-lite
    df.write_parquet(
        output_path,
        compression="snappy",
        use_pyarrow=True
    )
    print(f"--- [ÉXITO] Archivo guardado en: {output_path}")
    
    # Vista previa de validación
    print("\nVista Previa de Ordenamiento Temporal (Check de Año Nuevo):")
    print(df.select(["season", "year", "week", "absolute_season_week"]).unique().sort("absolute_season_week").head(20))

if __name__ == "__main__":
    # Procesar el dataset maestro limpio
    procesar_dataset_maestro("data/exports_10_years_clean.parquet")