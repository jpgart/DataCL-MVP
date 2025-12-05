# Variables del Dataset `dataset_dashboard_mvp.parquet`

## 📊 Información General del Dataset

- **Archivo**: `data/dataset_dashboard_mvp.parquet`
- **Total de registros**: 327,449
- **Temporadas incluidas**: 3
  - 2022-2023
  - 2023-2024
  - 2024-2025
- **Total de cajas**: 944,586,747
- **Total de kilos**: 7,107,333,695 kg (~7.1 millones de toneladas)

## 📋 Lista Completa de Variables

### 🕐 Variables Temporales

#### 1. `season` (string, **requerido**)
- **Descripción**: Temporada de exportación
- **Ejemplos**: "2022-2023", "2023-2024", "2024-2025"
- **Fuente original**: Columna "Season" en CSV
- **Uso**: Filtrado por temporada, agrupación temporal

#### 2. `year` (number, **requerido**)
- **Descripción**: Año de exportación
- **Tipo**: Entero (int64)
- **Fuente original**: Extraído de "ETD Week" (formato: semana-año)
- **Uso**: Filtrado por año, análisis anual

#### 3. `week` (number, **requerido**)
- **Descripción**: Semana del año (1-52)
- **Tipo**: Entero (int64)
- **Fuente original**: Extraído de "ETD Week" (formato: semana-año)
- **Uso**: Análisis semanal, series temporales

#### 4. `absolute_season_week` (number)
- **Descripción**: Índice calculado para ordenamiento temporal continuo entre temporadas
- **Tipo**: Entero
- **Calculado**: Generado por scripts de Python para mantener continuidad en gráficos
- **Uso**: Ordenamiento en series temporales que cruzan múltiples temporadas

---

### 🌍 Variables Geográficas

#### 5. `region` (string, opcional)
- **Descripción**: Región de origen de la exportación
- **Tipo**: String
- **Fuente original**: Columna "Region" en CSV
- **Uso**: Filtrado por región, análisis geográfico

#### 6. `market` (string, opcional)
- **Descripción**: Mercado de destino
- **Tipo**: String
- **Fuente original**: Columna "Market" en CSV
- **Uso**: Segmentación de mercados, análisis comercial

#### 7. `country` (string, **requerido**)
- **Descripción**: País de destino de la exportación
- **Tipo**: String (normalizado a mayúsculas)
- **Fuente original**: Columna "Country" en CSV
- **Uso**: Filtrado por país, rankings por destino, análisis geográfico

#### 8. `port_destination` (string, opcional)
- **Descripción**: Puerto de destino donde arriba la mercancía
- **Tipo**: String
- **Fuente original**: Columna "Arrival port" en CSV
- **Uso**: Análisis logístico, rutas de transporte

---

### 🍎 Variables de Producto

#### 9. `product` (string, **requerido**)
- **Descripción**: Nombre del producto/especie exportada
- **Tipo**: String (normalizado a Title Case)
- **Fuente original**: Columna "Specie" en CSV
- **Ejemplos**: "Grape", "Avocado", "Blueberry", "Apple", "Cherry"
- **Uso**: Filtrado por producto, rankings de productos, análisis por especie

#### 10. `variety` (string, opcional)
- **Descripción**: Variedad específica del producto
- **Tipo**: String
- **Fuente original**: Columna "Variety" en CSV
- **Ejemplos**: "Gala", "Fuji" (para manzanas), "Hass" (para paltas)
- **Uso**: Análisis de variedades, composición de productos

---

### 👥 Variables de Actores

#### 11. `exporter` (string, **requerido**)
- **Descripción**: Empresa o entidad exportadora
- **Tipo**: String (normalizado a Title Case)
- **Fuente original**: Columna "Exporter" en CSV
- **Uso**: Filtrado por exportador, rankings de exportadores, análisis competitivo

#### 12. `importer` (string, opcional)
- **Descripción**: Empresa o entidad importadora
- **Tipo**: String
- **Fuente original**: Columna "Importer" en CSV
- **Uso**: Análisis de importadores, relaciones comerciales

---

### 🚢 Variables de Transporte

#### 13. `transport` (string, opcional)
- **Descripción**: Medio de transporte utilizado
- **Tipo**: String
- **Fuente original**: Columna "Transport" en CSV
- **Ejemplos**: "Maritime", "Air", "Land"
- **Uso**: Análisis logístico, costos de transporte

---

### 📦 Variables de Volumen y Peso

#### 14. `boxes` (number, **requerido**)
- **Descripción**: Cantidad de cajas exportadas
- **Tipo**: Entero (int64)
- **Fuente original**: Columna "Boxes" en CSV
- **Uso**: Métricas de volumen, KPIs, rankings

#### 15. `net_weight_kg` (number, **requerido**)
- **Descripción**: Peso neto total en kilogramos
- **Tipo**: Decimal (float64)
- **Fuente original**: Columna "Kilograms" en CSV
- **Uso**: Métricas de peso, KPIs, rankings, cálculos de precio por kg

#### 16. `unit_weight_kg` (number, opcional)
- **Descripción**: Peso unitario promedio por caja (calculado)
- **Tipo**: Decimal
- **Fórmula**: `net_weight_kg / boxes`
- **Uso**: Análisis de consistencia, detección de outliers

---

### 🔍 Variables de Auditoría

#### 17. `is_outlier` (boolean, opcional)
- **Descripción**: Indica si el registro es un outlier estadístico
- **Tipo**: Boolean
- **Calculado**: Detectado mediante análisis estadístico
- **Uso**: Filtrado de datos anómalos, calidad de datos

---

### 💰 Variables Adicionales (Opcionales)

#### 18. `value_usd` (number, opcional)
- **Descripción**: Valor de la exportación en dólares estadounidenses
- **Tipo**: Decimal
- **Nota**: No siempre disponible en todos los registros
- **Uso**: Análisis de valor, cálculos de precio promedio, análisis económico

---

## 📊 Resumen Estadístico

| Categoría | Cantidad |
|-----------|----------|
| **Total de variables** | 17-18 (dependiendo de `value_usd`) |
| **Variables requeridas** | 8 |
| **Variables opcionales** | 9-10 |
| **Variables calculadas** | 2 (`absolute_season_week`, `unit_weight_kg`) |

### Variables Requeridas (8)
1. `season`
2. `year`
3. `week`
4. `country`
5. `product`
6. `exporter`
7. `boxes`
8. `net_weight_kg`

### Variables Calculadas (2)
1. `absolute_season_week` - Índice para ordenamiento temporal
2. `unit_weight_kg` - Peso promedio por caja

---

## 🔧 Uso en el Dashboard

### Componentes que utilizan estas variables:

1. **`smart-dashboard.tsx`**: Dashboard principal con KPIs y gráficos
2. **`exporters-deep-dive.tsx`**: Análisis detallado de exportadores
3. **`products-deep-dive.tsx`**: Análisis detallado de productos
4. **`filters-panel.tsx`**: Panel de filtros (season, country, product, exporter)
5. **`kpi-cards.tsx`**: Tarjetas de KPIs (boxes, net_weight_kg)
6. **`time-series-chart.tsx`**: Gráficos de series temporales
7. **`ranking-charts.tsx`**: Rankings por país, producto, exportador
8. **`ai-chat.tsx`**: Herramientas de IA para consultas analíticas

### Filtros Disponibles:
- **Temporada**: `season`
- **País**: `country` (múltiple)
- **Producto**: `product` (múltiple)
- **Exportador**: `exporter` (múltiple)

---

## 📝 Notas Técnicas

### Normalización de Datos
- **Países**: Convertidos a mayúsculas (UPPERCASE)
- **Productos**: Convertidos a Title Case
- **Exportadores**: Convertidos a Title Case
- **Semanas y Años**: Extraídos de "ETD Week" (formato: semana-año)

### Fuente de Datos
- **Archivo base**: `data/dataset_dashboard_ready.parquet`
- **Procesamiento**: Script `scripts/create_mvp_dataset.py`
- **Carga en dashboard**: `dashboard/src/lib/data-cache.ts`
- **Configuración**: Variable de entorno `DATA_DASHBOARD_PATH` (opcional)

### Columnas Originales (CSV) → Variables Normalizadas
| CSV Original | Variable Normalizada |
|--------------|---------------------|
| Season | `season` |
| ETD Week | `year`, `week` |
| Region | `region` |
| Market | `market` |
| Country | `country` |
| Transport | `transport` |
| Specie | `product` |
| Variety | `variety` |
| Importer | `importer` |
| Exporter | `exporter` |
| Arrival port | `port_destination` |
| Boxes | `boxes` |
| Kilograms | `net_weight_kg` |

---

## 🔗 Referencias

- **Schema Master**: `scripts/schema_master.json`
- **Tipo TypeScript**: `dashboard/src/types/exports.ts`
- **Carga de datos**: `dashboard/src/lib/data-cache.ts`
- **Métricas del dataset**: `data/dataset_dashboard_mvp_metrics.json`

---

**Última actualización**: Diciembre 2024

