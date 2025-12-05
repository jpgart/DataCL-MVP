# DataCL - Data Layer Phase 1

## Objetivo

Crear un dataset limpio, validado y consolidado a partir de ~760 archivos CSV semanales de exportaciones chilenas, transformándolos en un único archivo Parquet optimizado.

**Archivo objetivo:** `/data/exports_10_years.parquet`

## Estructura del Proyecto

```
DataCL/
├── data_raw/          # CSVs originales (~760 archivos semanales)
├── data_clean/        # Parquets intermedios normalizados
├── data/              # Dataset final consolidado
│   ├── exports_10_years.parquet
│   └── exports_10_years_clean.parquet
├── scripts/           # Scripts de procesamiento
│   ├── inventory.py         # Inventario y análisis de columnas
│   ├── generate_schema.py   # Generación de schema_master.json
│   ├── normalize.py         # Normalización de CSVs al esquema maestro
│   ├── audit_normalization.py # Auditoría de normalización (CSV vs Parquet)
│   ├── combine.py           # Combinación de Parquets en dataset maestro
│   ├── validate.py          # Validación del dataset final
│   └── clean_nulls.py       # Limpieza de valores nulos
├── analysis/          # Módulo de análisis (Fase 2)
│   ├── __init__.py
│   ├── loader.py      # Carga de datos con schema enforcement
│   ├── kpis.py        # Cálculo de KPIs
│   ├── top_n.py       # Rankings Top N
│   ├── filters.py     # Funciones de filtrado
│   ├── timeseries.py   # Análisis de series temporales
│   └── utils.py       # Utilidades y validación
├── notebooks/         # Notebooks de exploración
│   └── exploration.ipynb
├── audit/             # Reportes de auditoría
│   ├── full_audit.csv
│   └── audit_analysis.ipynb
├── requirements.txt   # Dependencias Python
└── README.md          # Este archivo
```

## Esquema Maestro

El dataset consolidado seguirá el siguiente esquema:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `week` | int | Semana del año |
| `year` | int | Año |
| `season` | str | Temporada |
| `hs_code` | str | Código HS del producto |
| `product` | str | Nombre del producto |
| `exporter` | str | Exportador |
| `country` | str | País de destino |
| `port_destination` | str | Puerto de destino (opcional) |
| `net_weight_kg` | float | Peso neto en kilogramos |
| `value_usd` | float | Valor en USD |

## Flujo de Procesamiento

### Fase 1B (Implementado)

1. **Inventario** (`scripts/inventory.py`)
   - Escanear archivos CSV en `data_raw/`
   - Leer headers de todos los CSVs (rápido)
   - Analizar columnas y variaciones
   - Generar `column_inventory.json` y `column_frequency.json`
   - Imprimir reporte de estructura

2. **Generación de Schema** (`scripts/generate_schema.py`)
   - Cargar resultados del inventario
   - Inferir esquema estandarizado
   - Crear mapeo de columnas raw → normalizadas
   - Generar `schema_master.json`

3. **Normalización** (`scripts/normalize.py`)
   - Cargar `schema_master.json`
   - Procesar cada CSV semanal:
     - Detectar encoding y separador
     - Extraer week y year desde "ETD Week" (formato: week-year)
     - Mapear columnas al esquema maestro
     - Normalizar valores (países, productos, texto)
     - Limpiar y validar tipos de datos
   - Guardar Parquet normalizado en `data_clean/`
   - Manejar errores sin detener el pipeline

4. **Auditoría** (`scripts/audit_normalization.py`)
   - Comparar datos CSV originales con Parquets normalizados
   - Calcular sumas de boxes y kilos en ambos formatos
   - Detectar discrepancias (deltas)
   - Generar reporte de reconciliación: `audit/full_audit.csv`
   - Mostrar resumen con estadísticas de precisión

### Fase 1C (Pendiente)

5. **Combinación** (`scripts/combine.py`)
   - Cargar todos los Parquets de `data_clean/`
   - Combinar en un único dataset
   - Guardar `exports_10_years.parquet` en `data/`

6. **Validación** (`scripts/validate.py`)
   - Validar esquema del dataset final
   - Verificar calidad de datos
   - Generar reporte de validación

## Requisitos Técnicos

- Python 3.8+
- Polars (procesamiento de datos)
- PyArrow / FastParquet (formato Parquet)
- tqdm (barras de progreso)

## Instalación

```bash
# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## Uso

### Fase 1B - Inventario y Normalización

```bash
# 1. Activar entorno virtual
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 2. Colocar CSVs en data_raw/

# 3. Ejecutar pipeline de Fase 1B
python scripts/inventory.py        # Analizar columnas
python scripts/generate_schema.py  # Generar schema maestro
python scripts/normalize.py        # Normalizar y convertir a Parquet
python scripts/audit_normalization.py  # Auditar normalización
```

### Fase 1C - Combinación y Validación

```bash
python scripts/combine.py   # Combinar Parquets en dataset maestro
python scripts/validate.py  # Validar dataset final
python scripts/clean_nulls.py  # Limpiar valores nulos
```

### Fase 2 - Módulo de Análisis

El módulo `analysis` proporciona funciones para analizar el dataset consolidado.

### Dataset MVP para el Dashboard

Para ambientes donde se requiere un dataset liviano (p. ej. MVP del dashboard Next.js), se puede generar un subconjunto con las 3 temporadas más recientes:

```bash
source venv/bin/activate
python scripts/create_mvp_dataset.py \
  --input data/dataset_dashboard_ready.parquet \
  --output data/dataset_dashboard_mvp.parquet \
  --seasons 2024-2025,2023-2024,2022-2023
```

El script:

- Crea `data/dataset_dashboard_mvp.parquet` (compresión snappy) con todas las columnas actuales.
- Genera `data/dataset_dashboard_mvp_metrics.json` con totales de filas, boxes y net_weight para auditoría rápida.
- Permite personalizar temporadas, rutas y archivo de métricas mediante flags (`python scripts/create_mvp_dataset.py --help`).

Este dataset es el recomendado para correr el dashboard en modo MVP.

**Nota sobre Internacionalización:**
- El dashboard Next.js tiene su interfaz de usuario completamente en inglés (textos, leyendas, labels, placeholders).
- El chat AI es multilingüe: detecta automáticamente el idioma del mensaje del usuario (español o inglés) y responde en el mismo idioma.
- Los datos y variables del código están en inglés.

#### Uso básico

```python
from analysis import load_data, get_total_boxes, top_products

# Cargar datos (con caché automático)
df = load_data()

# Calcular KPIs
total_boxes = get_total_boxes(df)
print(f"Total cajas: {total_boxes:,}")

# Top productos
top = top_products(df, n=10)
print(top)
```

#### Módulos disponibles

**loader.py** - Carga de datos
- `load_data()`: Carga el dataset con schema enforcement y caché
- `get_years()`, `get_countries()`, `get_products()`, `get_exporters()`: Valores únicos

**kpis.py** - KPIs
- `get_total_boxes()`, `get_total_kilos()`, `get_total_rows()`: KPIs globales
- `get_total_by_year()`, `get_total_by_country()`, etc.: KPIs por dimensión

**top_n.py** - Rankings
- `top_products()`, `top_countries()`, `top_exporters()`: Top N general
- `top_products_by_country()`, `top_countries_by_product()`: Top N cruzado

**filters.py** - Filtrado
- `filter_by_year()`, `filter_by_range_years()`: Filtros temporales
- `filter_by_country()`, `filter_by_product()`, `filter_by_exporter()`: Filtros por dimensión

**timeseries.py** - Series temporales
- `time_series_total()`: Serie temporal total
- `time_series_by_country()`, `time_series_by_product()`, etc.: Series por dimensión

#### Notebook de exploración

```bash
# Abrir Jupyter
jupyter notebook notebooks/exploration.ipynb
```

El notebook `notebooks/exploration.ipynb` contiene ejemplos completos de uso de todos los módulos.

## Notas

- Los scripts están diseñados para ser modulares y reutilizables
- Se utiliza Polars (no Pandas) para mejor rendimiento
- El procesamiento utiliza modo lazy de Polars cuando es apropiado
- Todos los scripts incluyen logging de progreso
- El módulo `analysis` está diseñado para validar lógica antes de migrar a TypeScript

