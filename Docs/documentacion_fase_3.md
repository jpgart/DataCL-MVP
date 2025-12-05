# Documentación Fase 3 - Dashboard Next.js (AgroAnalytics MVP)

## Resumen Ejecutivo

Este documento registra las instrucciones, resultados y lecciones aprendidas de la Fase 3 del proyecto DataCL, enfocada en la construcción del dashboard web "AgroAnalytics" usando Next.js 15, TypeScript, Vercel AI SDK, Recharts y TailwindCSS.

**Estado:** ✅ COMPLETADO

**Objetivo:** Construir MVP de "AgroAnalytics" (Dashboard Interno) que permita visualizar y analizar los datos de exportaciones procesados por el pipeline de Python.

---

## Stack Tecnológico

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **AI:** Vercel AI SDK
- **Visualización:** Recharts
- **Estilos:** TailwindCSS
- **Datos:** Parquet (parquetjs-lite)

---

## Arquitectura del Proyecto

```
DataCL/
├── data/                          # Fuente de verdad (Parquets)
│   └── dataset_dashboard_ready.parquet  # Archivo objetivo
├── scripts/                       # ETLs Python (solo lectura)
├── notebooks/                     # Análisis exploratorio (solo lectura)
└── dashboard/                     # ÁREA DE TRABAJO - App Next.js
    └── src/
        ├── lib/                   # Lógica de datos
        ├── components/dashboard/  # Componentes visuales
        └── types/                 # Definiciones TypeScript
```

---

## Fases de Implementación

### FASE 0: ARQUITECTURA DE CARPETAS Y RUTAS

**Objetivo:** Establecer la estructura base del proyecto sin tocar el código Python existente.

**Estado:** ✅ COMPLETADO

**Resultados:**
- Carpeta `dashboard/` creada en la raíz del proyecto
- Archivo `data/dataset_dashboard_ready.parquet` verificado (17MB, 1,754,553 filas)
- Arquitectura documentada

---

### FASE 1: SCAFFOLDING & CONFIGURACIÓN

**Objetivo:** Inicializar la aplicación Next.js con todas las configuraciones necesarias.

**Estado:** ✅ COMPLETADO

**Resultados:**
- Next.js 15 inicializado con TypeScript, ESLint, TailwindCSS, App Router
- Dependencias instaladas:
  - `parquetjs-lite` (lectura de Parquet)
  - `recharts` (gráficos)
  - `lucide-react` (iconos)
  - `clsx` y `tailwind-merge` (utilidades CSS)
  - `zod` (validación)
  - `ai` y `@ai-sdk/openai` (Vercel AI SDK)
  - `@ai-sdk/react` (hooks de React)
- Estructura de carpetas creada:
  - `src/lib/` (lógica de datos)
  - `src/components/dashboard/` (componentes visuales)
  - `src/types/` (definiciones TypeScript)
- Import alias `@/*` configurado en `tsconfig.json`

---

### FASE 2: DEFINICIÓN DE TIPOS (CONTRATO)

**Objetivo:** Establecer los contratos de datos TypeScript que coinciden con el schema del Parquet.

**Estado:** ✅ COMPLETADO

**Resultados:**
- `src/types/exports.ts` creado con:
  - `ExportRecord` interface (coincide con schema del Parquet)
  - `KPIResult` interface (métricas agregadas)
  - `FilterState` interface (estado de filtros)
- Tipos validados contra el dataset generado por Python
- Archivo de declaración de tipos para `parquetjs-lite` creado

---

### FASE 3: CAPA DE DATOS (SERVER SIDE)

**Objetivo:** Implementar la carga y procesamiento de datos desde el archivo Parquet.

**Estado:** ✅ COMPLETADO

**Resultados:**
- `src/lib/parquet-loader.ts` implementado:
  - Función `loadParquetData()` que lee el Parquet
  - Ruta absoluta configurada correctamente
  - Conversión correcta de tipos (Number(), Boolean())
  - Manejo de errores implementado
- `src/lib/data-engine.ts` implementado:
  - Clase `DataEngine` que recibe array de datos
  - Método `getTimeSeriesData()`:
    - Agrupa por `absolute_season_week`
    - Pivotea temporadas (season) como columnas
    - Ordena por `absolute_season_week` ascendente (CRÍTICO)
  - Métodos adicionales:
    - `getKPIs()`: Calcula KPIs globales
    - `getTopExporters()`: Top N exportadores
    - `getTopProducts()`: Top N productos
    - `filter()`: Filtra datos según FilterState
    - `getUniqueValues()`: Obtiene valores únicos de columnas

---

### FASE 4: VISUALIZACIÓN

**Objetivo:** Crear los componentes de dashboard con gráficos interactivos.

**Estado:** ✅ COMPLETADO

**Resultados:**
- `src/app/page.tsx` creado:
  - Server Component que llama a `loadParquetData()`
  - Pasa datos a componente cliente `<SmartDashboard>`
- `src/components/dashboard/smart-dashboard.tsx` creado:
  - Componente cliente que recibe `initialData`
  - Layout del dashboard implementado
- Gráficos con Recharts:
  - `TimeSeriesChart` (Evolución temporal):
    - Eje X: `absolute_season_week`
    - Series: Temporadas (season)
    - Tooltip que decodifica a "Semana Real"
  - `RankingCharts` (Rankings):
    - Top 5 Exportadores (BarChart)
    - Top 5 Productos (BarChart)
- Componentes de KPIs:
  - `KPICards`: Total de cajas, kilos, peso unitario promedio, registros
  - Diseño responsive con TailwindCSS

---

### FASE 5: INTELIGENCIA ARTIFICIAL (Vercel AI SDK)

**Objetivo:** Integrar chat AI que puede analizar los datos usando herramientas con function calling robusto.

**Estado:** ✅ COMPLETADO + MEJORAS IMPLEMENTADAS

**Resultados:**
- `src/app/api/chat/route.ts` implementado:
  - Endpoint POST usando `streamText` de `ai` v5.x
  - **Migrado de OpenAI a Google Gemini** usando `@ai-sdk/google`
  - Modelo: `gemini-2.5-flash` (actualizado para mejor rendimiento y thinking capabilities)
  - System prompt mejorado con detección automática de idioma: "You are Me-Vi, an expert analyst in agricultural exports. Detect the language of the user's message (Spanish or English) and respond in the same language."
  - **Chat Multilingüe:** El chat detecta automáticamente el idioma del mensaje del usuario (español o inglés) y responde en el mismo idioma
  - **Function Calling con Tools:**
    - `getGlobalKPIs`: Obtiene KPIs globales (cajas, kilos, exportadores, países únicos)
    - `getTopCountriesByKilos`: Ranking de países por kilos exportados (filtro opcional por año)
    - `getTopExportersByKilos`: Ranking de exportadores (empresas) por kilos exportados (filtros por año/producto)
    - `getTimeSeriesByCountry`: Series temporales anuales por país
  - **Multi-step tool execution:** Implementado `stopWhen` para permitir múltiples pasos (tool call → respuesta)
  - **Provider Options avanzadas:**
    - Safety settings configurables
    - Thinking config para modelos Gemini 2.5
    - Herramientas nativas de Google opcionales (search, url context, file search)
  - **Structured outputs:** Esquemas Zod para validación de respuestas de herramientas
  - **Descripciones de herramientas en inglés:** Todas las descripciones de herramientas traducidas a inglés para mejor comprensión del modelo
  - **Mensajes de error en inglés:** Todos los mensajes de error del sistema traducidos a inglés
- `src/lib/ai-tools.ts` creado:
  - Módulo centralizado con funciones de análisis que acceden al dataset
  - Caché de `DataEngine` para eficiencia
  - Normalización de productos (ej: "uvas" → "grape")
  - Validación con esquemas Zod
- `src/lib/ai-schemas.ts` creado:
  - Esquemas Zod para validación de outputs estructurados
  - `kpiSummarySchema`, `topCountriesSchema`, `topExportersSchema`, `timeSeriesSchema`
- `src/lib/ai-config.ts` creado:
  - Configuración centralizada de `providerOptions` para Gemini
  - Variables de entorno para ajustar safety, thinking, herramientas nativas
- `src/components/dashboard/ai-chat.tsx` mejorado:
  - **Corrección de renderizado:** Ahora muestra correctamente:
    - `TextPart` parts (texto de respuesta completo)
    - `ToolCallPart` parts (llamadas a herramientas con visualización)
    - `DataPart` parts (datos estructurados devueltos)
  - Panel flotante con botón de apertura/cierre
  - **Opciones avanzadas:** Panel para instrucciones de sistema personalizadas
  - Renderiza conversación con streaming correcto
  - Manejo de estados de carga y errores
  - Metadata opcional (tokens, safety ratings)
  - Diseño responsive y accesible
  - **UI en inglés:** Todos los textos de la interfaz del chat traducidos a inglés (excepto el sistema de detección de idioma)
- **Configuración de API Key (Gemini):**
  - Dependencia instalada: `@ai-sdk/google` agregada al proyecto
  - Variable de entorno: `GOOGLE_GENERATIVE_AI_API_KEY` en `.env.local`
  - Obtener key en [Google AI Studio](https://aistudio.google.com/apikey)
  - Archivo `.env.local` creado con la API key configurada
- **Variables de entorno adicionales (opcionales):**
  - `GOOGLE_SEARCH_ENABLED`: Habilita búsqueda web de Google
  - `GOOGLE_URL_CONTEXT_ENABLED`: Permite análisis de URLs
  - `GOOGLE_FILE_SEARCH_STORES`: Configuración de File Search stores
  - `GOOGLE_THINKING_BUDGET`, `GOOGLE_THINKING_LEVEL`: Control de thinking mode

---

## Resultados

✅ **Completado exitosamente:**

### Dataset MVP (3 temporadas)

- Se creó el script `scripts/create_mvp_dataset.py` (Polars) para generar subconjuntos con temporadas específicas.
- Para el MVP se filtraron las temporadas `2024-2025`, `2023-2024` y `2022-2023` (últimas 3 temporadas).
- Dataset resultante: `data/dataset_dashboard_mvp.parquet` (327 449 registros, 3 temporadas, 944 586 747 boxes, 7 107 333 695 kg).
- Métricas registradas en `data/dataset_dashboard_mvp_metrics.json`.
- El dashboard usa este archivo por defecto (ruta relativa `../data/dataset_dashboard_mvp.parquet`); para alternar basta setear `DATA_DASHBOARD_PATH`.
- Comando sugerido para regenerar el subset:

```bash
source venv/bin/activate
python scripts/create_mvp_dataset.py \
  --input data/dataset_dashboard_ready.parquet \
  --output data/dataset_dashboard_mvp.parquet \
  --seasons 2024-2025,2023-2024,2022-2023
```

- Variables de entorno relevantes para el dashboard:
  - `DATA_DASHBOARD_PATH`: ruta al Parquet a consumir (por defecto apunta al dataset MVP).
  - `DATA_PYTHON_BIN`: intérprete de Python con Polars instalado (ej. `venv/bin/python`) utilizado por la API `/api/data`.

**Estructura Creada:**
- Directorio `/dashboard/` con aplicación Next.js 15 completa
- 10 archivos TypeScript/TSX implementados
- Build exitoso sin errores

**Archivos Implementados:**
1. `src/types/exports.ts` - Definiciones de tipos (extendido con `value_usd`)
2. `src/types/parquetjs-lite.d.ts` - Declaración de tipos para parquetjs-lite
3. `src/lib/parquet-loader.ts` - Carga de datos desde Parquet
4. `src/lib/data-engine.ts` - Motor de procesamiento de datos (extendido con 10 nuevos métodos)
5. `src/lib/ai-tools.ts` - Herramientas de análisis para el chat AI
6. `src/lib/ai-schemas.ts` - Esquemas Zod para validación de outputs
7. `src/lib/ai-config.ts` - Configuración centralizada de Gemini
8. `src/app/page.tsx` - Página principal (Server Component)
9. `src/app/api/chat/route.ts` - Endpoint de chat AI con function calling
10. `src/app/exporters/page.tsx` - Página Exporter Deep Dive (Server Component)
11. `src/app/exporters/loading.tsx` - Estado de carga para exportadores
12. `src/app/products/page.tsx` - Página Product Deep Dive (Server Component)
13. `src/app/products/loading.tsx` - Estado de carga para productos
14. `src/components/dashboard/smart-dashboard.tsx` - Dashboard principal (con navegación a Deep Dive)
15. `src/components/dashboard/kpi-cards.tsx` - Tarjetas de KPIs
16. `src/components/dashboard/time-series-chart.tsx` - Gráfico temporal
17. `src/components/dashboard/ranking-charts.tsx` - Gráficos de rankings
18. `src/components/dashboard/ai-chat.tsx` - Componente de chat AI mejorado
19. `src/components/dashboard/filters-panel.tsx` - Panel de filtros interactivos
20. `src/components/dashboard/loading-indicator.tsx` - Indicador de carga de datos
21. `src/components/dashboard/exporters-deep-dive.tsx` - Componente principal Exporter Deep Dive
22. `src/components/dashboard/exporter-kpi-cards.tsx` - KPIs de exportador
23. `src/components/dashboard/exporter-products-chart.tsx` - Productos del exportador
24. `src/components/dashboard/exporter-countries-chart.tsx` - Países de destino (donut)
25. `src/components/dashboard/exporter-yoy-trend.tsx` - Tendencia YoY del exportador
26. `src/components/dashboard/exporter-competitive.tsx` - Posicionamiento competitivo
27. `src/components/dashboard/products-deep-dive.tsx` - Componente principal Product Deep Dive
28. `src/components/dashboard/product-kpi-cards.tsx` - KPIs de producto
29. `src/components/dashboard/product-exporters-chart.tsx` - Exportadores del producto
30. `src/components/dashboard/product-countries-treemap.tsx` - Treemap de países (SVG personalizado)
31. `src/components/dashboard/product-dual-trend.tsx` - Tendencia dual (boxes vs precio)
32. `src/components/dashboard/product-variety-composition.tsx` - Composición de variedades

**Características Implementadas:**
- ✅ Carga de datos desde Parquet (server-side)
- ✅ Visualización de KPIs globales (8 métricas: 4 básicas + 4 únicas)
- ✅ Gráfico temporal con continuidad (absolute_season_week)
- ✅ Rankings Top 5 (Exportadores y Productos) con filtros de temporada y producto
- ✅ Panel de filtros interactivos con búsqueda
- ✅ Chat AI con function calling robusto:
  - 4 herramientas de análisis (KPIs, países, exportadores, series temporales)
  - Multi-step tool execution
  - Structured outputs con validación Zod
  - Distinción correcta entre países y exportadores
  - Respuestas completas con cajas/kilos y temporadas
  - Renderizado correcto de texto, tool calls y datos estructurados
  - Opciones avanzadas para instrucciones personalizadas
  - Chat multilingüe con detección automática de idioma (español/inglés)
- ✅ Indicador visual de carga de datos
- ✅ Series temporales por dimensión (país, producto, exportador)
- ✅ UI completamente en inglés: todos los textos, leyendas, labels y placeholders traducidos
- ✅ **Páginas de Análisis Profundo (Deep Dive Pages):**
  - **Exporter Deep Dive (`/exporters`):** Análisis detallado de exportadores individuales
    - 3 KPIs específicos (boxes, share %, top country)
    - Top productos exportados (barras horizontales)
    - Distribución por país de destino (donut chart)
    - Tendencia YoY semanal (gráfico de líneas)
    - Posicionamiento competitivo vs top 5 (barras agrupadas)
  - **Product Deep Dive (`/products`):** Análisis detallado de productos individuales
    - 3 KPIs específicos (kg, % cambio YoY, precio promedio)
    - Top 10 exportadores con participación % (barras horizontales)
    - Distribución por país (Treemap personalizado SVG)
    - Tendencia anual boxes vs precio (gráfico dual-axis)
    - Composición de variedades por temporada (barras apiladas 100%)
- ✅ Navegación a páginas Deep Dive desde dashboard principal
- ✅ Diseño responsive con TailwindCSS
- ✅ TypeScript completo con tipos seguros

---

## Problemas Encontrados y Soluciones

### 1. Importación de `useChat` desde `@ai-sdk/react`

**Problema:**
- La API de `useChat` cambió en versiones recientes
- El hook no expone `input` y `handleInputChange` directamente

**Solución:**
- Implementación custom del componente de chat usando `fetch` directamente
- Manejo manual del streaming de respuestas
- Estado local para el input del usuario

### 2. Tipos de TypeScript para `parquetjs-lite`

**Problema:**
- `parquetjs-lite` no tiene tipos TypeScript incluidos
- Error: "Could not find a declaration file for module 'parquetjs-lite'"

**Solución:**
- Creado archivo `src/types/parquetjs-lite.d.ts` con declaraciones de tipos
- Definidas interfaces `ParquetReader` y `ParquetCursor`

### 3. API de herramientas en Vercel AI SDK v5

**Problema:**
- La API cambió de `parameters` a `inputSchema`
- El método de respuesta cambió de `toDataStreamResponse()` a `toTextStreamResponse()`

**Solución:**
- Actualizado a usar `inputSchema` con `z.object()` de Zod
- Cambiado a `toTextStreamResponse()` para streaming de texto

### 4. Tipo de retorno en `getTimeSeriesData()`

**Problema:**
- TypeScript no infería correctamente el tipo de retorno con índices dinámicos

**Solución:**
- Especificado tipo explícito en el Map: `Map<number, { absolute_season_week: number; [season: string]: number | string }>`
- Asegurado que `absolute_season_week` siempre esté presente

### 5. Migración de OpenAI a Google Gemini

**Cambio realizado:**
- Se migró el chat AI de OpenAI (`@ai-sdk/openai`) a Google Gemini (`@ai-sdk/google`)
- Modelo cambiado de `gpt-4o-mini` a `gemini-1.5-flash`
- Variable de entorno actualizada de `OPENAI_API_KEY` a `GOOGLE_GENERATIVE_AI_API_KEY`
- Archivo `.env.local` creado con la configuración de Gemini

**Beneficios:**
- Mejor relación costo/rendimiento con Gemini Flash
- API key gratuita disponible en Google AI Studio
- Compatibilidad completa con Vercel AI SDK y herramientas

### 6. Error de longitud de cadena al cargar datos en el dashboard

**Problema:**
- El endpoint `/api/data` acumulaba todo el JSON en memoria (≈1.7 M de filas >100 MB) provocando `RangeError: Invalid string length` y caída del servidor durante la carga del dashboard.
- El caché interno tenía un límite fijo de 100 MB, por lo que la lectura se abortaba antes de completar el streaming.

**Solución / Medidas propuestas:**
- Reescribir `data-cache` para procesar el stream de Python en formato NDJSON línea por línea, evitando concatenar buffers gigantes.
- Incrementar el límite por defecto a 512 MB y hacerlo configurable mediante `DATA_CACHE_MAX_CHUNK_BYTES`.
- Añadir parámetros opcionales `DATA_CACHE_ROW_LIMIT` y `DATA_CACHE_SELECT_COLUMNS` para reducir el dataset desde la fuente cuando sea necesario.
- Registrar métricas (bytes, registros, errores de parseo) y mensajes claros cuando se exceda el límite, sugiriendo ajustar las variables o regenerar el Parquet.

### 7. Chat AI solo mostraba tokens en lugar del texto de respuesta

**Problema:**
- El componente `ai-chat.tsx` no estaba renderizando correctamente los `parts` del stream de `useChat`.
- Solo se mostraba la metadata (tokens) y no el texto de la respuesta del modelo.
- El stream incluía `TextPart`, `ToolCallPart` y `DataPart` pero el componente solo accedía a `message.content`.

**Solución:**
- Actualizado `ai-chat.tsx` para iterar explícitamente sobre `message.parts`:
  - Filtrado de `TextPart` para mostrar el texto completo
  - Filtrado de `ToolCallPart` para visualizar llamadas a herramientas
  - Filtrado de `DataPart` para mostrar datos estructurados
- Implementado fallback a `message.content` cuando no hay parts disponibles.
- Ahora el chat muestra correctamente el texto de respuesta junto con metadata opcional.

### 8. Confusión entre países y exportadores en preguntas del chat

**Problema:**
- Preguntas como "¿Quién es el mayor exportador de uvas?" devolvían países (U.S.A., CHINA) en lugar de empresas exportadoras.
- El modelo confundía "exportador" (empresa) con "país de destino" (country).

**Solución:**
- Agregada herramienta específica `getTopExportersByKilos()` en `ai-tools.ts`:
  - Agrupa por campo `exporter` (empresa) en lugar de `country`
  - Filtros opcionales por año y producto
  - Normalización de productos (ej: "uvas" → "grape") para mejor matching
- Actualizado mensaje de sistema para aclarar que "quién/exportador" se refiere a empresas, no países.
- El modelo ahora distingue correctamente entre herramientas de países y exportadores.

### 9. Respuestas incompletas (faltaban cajas o temporadas)

**Problema:**
- Las respuestas del chat solo mostraban kilos cuando el usuario no especificaba la métrica.
- No se indicaban las temporadas consideradas cuando el usuario no especificaba un periodo.

**Solución:**
- Actualizado mensaje de sistema para instruir al modelo a:
  - Incluir siempre **ambos valores** (cajas y kilos) cuando estén disponibles
  - Especificar las **temporadas consideradas** cuando no se indica un periodo específico
- Las respuestas ahora son más completas y contextualizadas automáticamente.

---

## Lecciones Aprendidas

### 1. Separación Server/Client Components

**✅ Lo que funcionó bien:**
- Carga de datos en Server Component (`page.tsx`)
- Procesamiento pesado en el servidor
- Solo componentes interactivos como Client Components

**Beneficios:**
- Mejor performance inicial
- Menos JavaScript en el cliente
- SEO mejorado

### 2. TypeScript Estricto

**✅ Lo que funcionó bien:**
- Tipos explícitos desde el inicio
- Interfaces que coinciden exactamente con el schema del Parquet
- Validación en tiempo de compilación

**Beneficios:**
- Detecta errores antes de ejecución
- Autocompletado mejorado
- Refactoring más seguro

### 3. Ordenamiento Crítico para Gráficos Temporales

**✅ Lo que funcionó bien:**
- Implementación de `absolute_season_week` para continuidad temporal
- Ordenamiento explícito en `getTimeSeriesData()`
- Tooltip que decodifica a "Semana Real"

**Beneficios:**
- Gráficos muestran continuidad lógica (enero después de diciembre)
- Mejor UX en visualizaciones temporales

### 4. Manejo de Streaming en Chat AI

**✅ Lo que funcionó bien:**
- Implementación con `useChat` de `@ai-sdk/react`
- Renderizado correcto de `message.parts` (TextPart, ToolCallPart, DataPart)
- Parsing de chunks del stream
- Actualización incremental del estado

**Beneficios:**
- Respuestas aparecen en tiempo real
- Mejor experiencia de usuario
- No bloquea la UI
- Visualización clara de tool calls y datos estructurados

### 5. Function Calling con Vercel AI SDK

**✅ Lo que funcionó bien:**
- Separación de herramientas en módulo dedicado (`ai-tools.ts`)
- Esquemas Zod para validación de outputs estructurados
- Multi-step tool execution con `stopWhen`
- Configuración centralizada de provider options

**Beneficios:**
- Código modular y mantenible
- Validación automática de respuestas de herramientas
- Mejor control del flujo de ejecución
- Fácil extensión con nuevas herramientas

---

## Lista de Verificación (Auditoría)

- [x] ¿El proyecto Next.js está aislado en la carpeta `dashboard/`? ✅
- [x] ¿La lectura del Parquet apunta a la ruta absoluta correcta? ✅
- [x] ¿Los tipos numéricos se fuerzan con `Number()` al leer el parquet? ✅
- [x] ¿El gráfico temporal usa `absolute_season_week` para el eje X? ✅
- [x] ¿El ordenamiento por `absolute_season_week` está implementado? ✅
- [x] ¿Los componentes están correctamente separados (Server vs Client)? ✅
- [x] ¿El AI puede acceder y analizar los datos correctamente? ✅
- [x] ¿El chat AI renderiza correctamente el texto de respuesta? ✅
- [x] ¿El chat AI distingue entre países y exportadores? ✅
- [x] ¿Las respuestas incluyen cajas y kilos cuando están disponibles? ✅
- [x] ¿Las respuestas especifican las temporadas consideradas? ✅

## Páginas de Análisis Profundo (Deep Dive Pages)

### Exporter Deep Dive (`/exporters`)

**Objetivo:** Responder a "¿Cómo se desempeña el exportador X comparado con competidores y en el tiempo?"

**Estructura:**
- **Filtros:** Exportador (requerido), Temporada (opcional), Producto (opcional)
- **Sección 1 - Métricas Clave:** 3 tarjetas KPI
  - Total Boxes Exported
  - Global Share %
  - Top Destination Country
- **Sección 2 - Distribución Dimensional:**
  - Gráfico de Barras Horizontales: "Top Products Exported by Firm"
  - Gráfico de Donut: "Distribution by Destination Country"
- **Sección 3 - Tendencia y Comparación:**
  - Gráfico de Líneas: "Weekly Box Trend (YoY Comparison)" - Compara dos temporadas
  - Gráfico de Barras Agrupadas: "Positioning vs Top 5 Competitors" - Muestra boxes y % cambio YoY

**Métodos del DataEngine:**
- `getExporterKPIs()`: Calcula KPIs específicos del exportador
- `getExporterTopProducts()`: Top N productos por cajas
- `getExporterCountryDistribution()`: Distribución por país de destino
- `getExporterTimeSeriesYoY()`: Comparación año sobre año
- `getCompetitivePositioning()`: Posicionamiento vs top 5 competidores

### Product Deep Dive (`/products`)

**Objetivo:** Responder a "¿Qué está sucediendo con el Producto X, quién lo mueve y a dónde va?"

**Estructura:**
- **Filtros:** Producto (requerido), Temporada (opcional), Región de Destino (opcional)
- **Sección 1 - Métricas Clave:** 3 tarjetas KPI
  - Total Kilograms Exported
  - % Change (vs. Previous Year) - Destacado en rojo si negativo
  - Estimated Average Price (per Kg) - Muestra "N/A" si no hay datos de precio
- **Sección 2 - Actores Clave y Distribución:**
  - Gráfico de Barras Horizontales: "Top 10 Exporters of the Product" - Muestra participación % por volumen
  - Treemap: "Total Volume by Destination Country (Key Markets)" - Cuadros más grandes = mayor volumen
- **Sección 3 - Análisis de Rendimiento y Variedad:**
  - Gráfico de Líneas Dual: "Annual Trend of Boxes vs. Average Price" - Dos ejes Y para comparar volumen y precio
  - Gráfico de Barras Apiladas 100%: "Variety Composition by Season" - Muestra cómo ha cambiado la mezcla de variedades

**Métodos del DataEngine:**
- `getProductKPIs()`: Calcula KPIs del producto (kilos, % cambio YoY, precio promedio)
- `getProductTopExporters()`: Top N exportadores con porcentaje de participación
- `getProductCountryDistribution()`: Distribución por país con porcentajes
- `getProductDualTimeSeries()`: Series temporales anuales (boxes vs precio)
- `getProductVarietyComposition()`: Composición de variedades por temporada

**Características Técnicas:**
- Arquitectura de páginas separadas siguiendo recomendaciones de Next.js (`Tec Base/Next.js.md`)
- Code splitting automático para mejor rendimiento
- Server Components para carga de datos, Client Components para interactividad
- Treemap implementado con SVG personalizado (sin dependencias externas)
- Manejo de estados vacíos y mensajes informativos
- Todos los textos en inglés
- Diseño responsive y profesional

## Próximos Pasos

**Mejoras Sugeridas:**
1. ✅ ~~Agregar filtros interactivos en el dashboard~~ (COMPLETADO - Panel de filtros con búsqueda implementado)
2. Exportar datos a CSV/Excel
3. ✅ ~~Más tipos de gráficos (scatter, heatmap)~~ (COMPLETADO - Treemap implementado)
4. ✅ ~~Comparación entre temporadas~~ (COMPLETADO - YoY comparison en Exporter Deep Dive)
5. Análisis de tendencias y proyecciones
6. ✅ ~~Configuración de variables de entorno para producción~~ (COMPLETADO - Variables documentadas y configuradas)
7. Tests unitarios y de integración
8. Integración de herramientas nativas de Google (search, url context) cuando sea necesario
9. Mejoras en visualización de tool calls y datos estructurados en el chat
10. ✅ ~~Páginas de análisis profundo para exportadores y productos~~ (COMPLETADO - Exporter Deep Dive y Product Deep Dive implementadas)

---

## Refactor UI/UX - BATCH 1: Foundations

**Objetivo:** Establecer un sistema visual consistente (cards, tipografía, espaciado, layout básico y navegación) sin tocar la lógica de gráficos profundamente.

**Estado:** ✅ COMPLETADO

**Resultados:**

### Componentes Base Creados

1. **`src/lib/utils.ts`**
   - Utilidad `cn` para combinar clases de Tailwind (clsx + tailwind-merge)
   - Permite composición condicional de clases CSS

2. **`src/components/ui/card.tsx`**
   - Componente Card base reutilizable
   - Estilos: `bg-white rounded-lg shadow-sm border border-gray-200 p-6`
   - Variantes: `default`, `highlighted`, `compact`

3. **`src/components/ui/kpi-card.tsx`**
   - Componente KPICard unificado
   - Props: `title`, `value`, `icon`, `trend?`, `tone?`, `highlighted?`
   - Jerarquía visual:
     - Valor dominante: `text-3xl font-bold`
     - Título pequeño: `text-sm text-gray-600`
     - Icono sutil: `w-6 h-6 opacity-70`
   - Tones semánticos: `positive` (verde), `negative` (rojo), `neutral` (azul)
   - Soporte para indicadores de tendencia con iconos TrendingUp/Down

4. **`src/components/ui/breadcrumb.tsx`**
   - Componente Breadcrumb para navegación clara
   - Props: `items: Array<{ label: string; href?: string }>`
   - Estilo: texto pequeño, separadores (›), último item como activo

5. **`src/components/ui/back-to-dashboard.tsx`**
   - Componente mejorado para volver al dashboard
   - Iconos: ArrowLeft + Home
   - Estilo consistente y visible

### Refactorización de Componentes

**KPI Cards Unificados:**
- `kpi-cards.tsx` - Refactorizado para usar `KPICard` base (8 tarjetas)
- `exporter-kpi-cards.tsx` - Refactorizado para usar `KPICard` base (3 tarjetas)
- `product-kpi-cards.tsx` - Refactorizado para usar `KPICard` base con highlight negativo (3 tarjetas)

**Páginas Principales:**
- `smart-dashboard.tsx` - Agregado breadcrumb, mejorado espaciado y tipografía, agregado `px-6` al contenedor
- `exporters-deep-dive.tsx` - Agregado breadcrumb y `BackToDashboard`, mejorado espaciado y tipografía, agregado `px-6` al contenedor
- `products-deep-dive.tsx` - Agregado breadcrumb y `BackToDashboard`, mejorado espaciado y tipografía, agregado `px-6` al contenedor

### Sistema de Tipografía y Espaciado

**Tipografía:**
- Títulos principales: `text-3xl font-bold`
- Subtítulos de sección: `text-2xl font-bold`
- Subtítulos de cards: `text-xl font-semibold`
- Labels y helper text: `text-sm text-gray-600`

**Espaciado:**
- Secciones principales: `mb-8` (32px)
- Headers dentro de secciones: `mb-4` (16px)
- Grid gaps: `gap-4` (16px) o `gap-6` (24px)
- Padding de cards: `p-6` (24px)

### Layout y Contenedores

- Todos los contenedores principales usan `max-w-7xl mx-auto px-6`
- Padding horizontal consistente en todas las páginas
- Layout centrado y responsive

### Navegación Mejorada

**Breadcrumbs implementados:**
- Dashboard: `[Dashboard]`
- Exporter Analysis: `[Dashboard] > [Exporter Analysis]`
- Product Analysis: `[Dashboard] > [Product Analysis]`

**Botón "Back to Dashboard":**
- Iconos ArrowLeft + Home
- Mejor visibilidad y consistencia
- Posicionamiento uniforme en todas las páginas deep dive

### Mejoras Visuales Logradas

✅ **Cohesión Visual:**
- Componente Card base unificado con estilos consistentes (`shadow-sm`, `border-gray-200`)
- Componente KPICard unificado con jerarquía clara
- Iconos pequeños y sutiles

✅ **Sistema de Tipografía:**
- Escala consistente de tamaños de fuente
- Pesos de fuente normalizados (bold, semibold, medium)

✅ **Sistema de Espaciado:**
- Ritmo vertical consistente
- Márgenes y padding normalizados

✅ **Layout:**
- Contenedores centrados con padding uniforme
- Diseño responsive mantenido

✅ **Navegación:**
- Breadcrumbs claros y consistentes
- Botones de navegación mejorados

✅ **Jerarquía de KPIs:**
- Valores visualmente dominantes
- Títulos más pequeños y muted
- Soporte para estados destacados (highlighted)

### Archivos Creados

1. `src/lib/utils.ts`
2. `src/components/ui/card.tsx`
3. `src/components/ui/kpi-card.tsx`
4. `src/components/ui/breadcrumb.tsx`
5. `src/components/ui/back-to-dashboard.tsx`

### Archivos Modificados

1. `src/components/dashboard/kpi-cards.tsx`
2. `src/components/dashboard/exporter-kpi-cards.tsx`
3. `src/components/dashboard/product-kpi-cards.tsx`
4. `src/components/dashboard/smart-dashboard.tsx`
5. `src/components/dashboard/exporters-deep-dive.tsx`
6. `src/components/dashboard/products-deep-dive.tsx`

## Refactor UI/UX - BATCH 2: Filters & Performance Improvements

**Objetivo:** Mejorar el rendimiento del panel de filtros, agregar búsqueda con debounce, listas virtualizadas, skeleton loaders y optimizar re-renders con memoización.

**Estado:** ✅ COMPLETADO

**Resultados:**

### Componentes y Hooks Creados

1. **`src/hooks/use-debounce.ts`**
   - Hook genérico para debounce (delay: 300ms por defecto)
   - Aplicado a todas las búsquedas en `filters-panel.tsx`

2. **`src/components/ui/virtualized-list.tsx`**
   - Componente para listas largas usando `@tanstack/react-virtual`
   - Max-height: 200px, smooth scroll
   - Renderiza solo items visibles para mejor rendimiento
   - Soporte para multi-select

3. **`src/components/ui/filter-chip.tsx`**
   - Componente pequeño para mostrar filtros activos
   - Estilo: rounded pills con botón de eliminación
   - Hover effects y transiciones

4. **`src/components/ui/skeleton.tsx`**
   - Componente reutilizable con variantes:
     - `text`, `card`, `chart`, `small-block`, `large-block`
   - Componentes pre-construidos:
     - `SkeletonCard`, `SkeletonKPICard`, `SkeletonChart`
   - Animación pulse para feedback visual

### Mejoras Implementadas

**Panel de Filtros Refactorizado:**
- Layout más compacto con `Card` component
- Tipografía consistente (`text-sm` para labels, `text-xl` para títulos)
- Espaciado mejorado (`gap-6`, `mb-6`)
- Listas virtualizadas para Exporters, Countries, Products
- Sección "Active Filters" con `FilterChip` components
- Búsqueda con debounce (300ms) en todos los inputs

**Memoización:**
- `useCallback` aplicado a todos los handlers de filtros
- `useMemo` aplicado a transformaciones de datos costosas
- Todos los componentes de gráficos envueltos en `React.memo`

**Skeleton Loaders:**
- Aplicados en `smart-dashboard.tsx` para KPIs, Time Series, Rankings
- Aplicados en `exporters-deep-dive.tsx` para KPIs y Charts
- Aplicados en `products-deep-dive.tsx` para KPIs y Charts

### Archivos Creados

1. `src/hooks/use-debounce.ts`
2. `src/components/ui/virtualized-list.tsx`
3. `src/components/ui/filter-chip.tsx`
4. `src/components/ui/skeleton.tsx`

### Archivos Modificados

1. `src/components/dashboard/filters-panel.tsx` - Refactor completo
2. `src/components/dashboard/smart-dashboard.tsx` - Callbacks memoizados, skeletons
3. `src/components/dashboard/exporters-deep-dive.tsx` - Callbacks memoizados, skeletons
4. `src/components/dashboard/products-deep-dive.tsx` - Callbacks memoizados, skeletons
5. Todos los componentes de gráficos - Envueltos en `React.memo`

### Dependencias Instaladas

- `@tanstack/react-virtual` - Para listas virtualizadas

---

## Refactor UI/UX - BATCH 3: Charts & Visual Excellence

**Objetivo:** Establecer un sistema de colores centralizado, tooltips compartidos, estilos consistentes de ejes, agregación inteligente de categorías y mejoras visuales profesionales en todos los gráficos.

**Estado:** ✅ COMPLETADO

**Resultados:**

### Sistema de Colores Centralizado

1. **`src/lib/chart-colors.ts`**
   - Paleta categórica de 12 colores (basada en D3 Category10/Tableau10)
   - Función `getChartColor(index)` con wrap-around para listas largas
   - Mapeo semántico: `getSemanticColor(tone)` para positive/negative/neutral/warning/info
   - Tema de gráficos (`CHART_THEME`) con colores para:
     - Grid: `#e5e7eb` (gray-200), strokeDasharray "3 3"
     - Axis: tick color `#6b7280` (gray-500), label color `#374151` (gray-700), fontSize 13px

### Utilidades de Gráficos

2. **`src/lib/chart-utils.ts`**
   - `aggregateSmallCategories()` - Agrega categorías pequeñas en "Others" (mantiene integridad de totales)
   - `normalizeSeriesData()` - Normaliza datos para renderizado consistente (sorting, null handling)
   - `formatChartNumber()` - Formatea números con Intl.NumberFormat (decimal, currency, percent)
   - `calculatePercentage()` - Calcula porcentajes para gráficos apilados

### Tooltip Compartido

3. **`src/components/ui/chart-tooltip.tsx`**
   - Componente unificado para todos los gráficos
   - Fondo blanco, bordes redondeados, sombra sutil
   - Tipografía consistente (text-sm, font-medium)
   - Formateo de números consistente
   - Soporte para formatters personalizados
   - Muestra color indicator y valores formateados

### Mejoras Implementadas

**Sistema de Colores:**
- Todos los gráficos actualizados para usar `getChartColor()` del sistema centralizado
- Colores semánticos aplicados donde corresponde (ej: highlight negativo en rojo)
- Eliminados todos los colores hardcodeados

**Estilos Consistentes de Ejes:**
- Font size: 13px en todos los ejes
- Tick color: `#6b7280` (gray-500)
- Grid color: `#e5e7eb` (gray-200)
- Grid style: strokeDasharray "3 3"
- Label color: `#374151` (gray-700)
- Mejor contraste y legibilidad

**Agregación Inteligente:**
- `product-variety-composition.tsx` - Agrega categorías pequeñas en "Others" (top 8 + Others)
- Reduce sobrecarga visual en gráficos apilados
- Mantiene integridad de totales

**Mejoras de Interacción:**
- `dot={false}` en líneas para apariencia más limpia
- `activeDot={{ r: 4 }}` para feedback visual en hover
- Transiciones suaves en tooltips

### Archivos Creados

1. `src/lib/chart-colors.ts`
2. `src/lib/chart-utils.ts`
3. `src/components/ui/chart-tooltip.tsx`

### Archivos Modificados (10 componentes de gráficos)

1. `time-series-chart.tsx` - Sistema de colores, ChartTooltip, estilos de ejes, mejoras de interacción
2. `ranking-charts.tsx` - Sistema de colores, ChartTooltip, estilos de ejes
3. `exporter-products-chart.tsx` - Sistema de colores, ChartTooltip, estilos de ejes
4. `exporter-countries-chart.tsx` - Sistema de colores, ChartTooltip, estilos de leyenda
5. `exporter-yoy-trend.tsx` - Sistema de colores, ChartTooltip, estilos de ejes, mejoras de interacción
6. `exporter-competitive.tsx` - Sistema de colores semántico, ChartTooltip, estilos de ejes duales
7. `product-exporters-chart.tsx` - Sistema de colores, ChartTooltip, estilos de ejes
8. `product-countries-treemap.tsx` - Sistema de colores centralizado
9. `product-dual-trend.tsx` - Sistema de colores, ChartTooltip, estilos de ejes duales, mejoras de interacción
10. `product-variety-composition.tsx` - Sistema de colores, ChartTooltip, estilos de ejes, agregación de categorías

### Mejoras Visuales Logradas

✅ **Sistema de Colores Unificado:**
- Todos los gráficos usan la misma paleta
- Colores semánticos para estados (positive/negative)
- Consistencia visual en todo el dashboard

✅ **Tooltips Consistentes:**
- Mismo diseño y comportamiento en todos los gráficos
- Formateo de números consistente
- Mejor legibilidad

✅ **Estilos de Ejes Consistentes:**
- Font size: 13px en todos los ejes
- Tick color: gray-500
- Grid color: gray-200
- Mejor contraste y legibilidad

✅ **Agregación Inteligente:**
- Reduce sobrecarga visual en gráficos apilados
- Mantiene integridad de totales

✅ **Mejoras de Interacción:**
- Hover effects mejorados
- Transiciones suaves
- Feedback visual claro

---

## PHASE 4 — Analytics + Function Calling

**Objetivo:** Extender el toolkit de analytics con nuevas funciones, corregir el error de TypeScript en `api/chat/route.ts`, y mejorar la interfaz de function calling para que Gemini pueda responder preguntas sobre datos usando funciones reales del dataset.

**Estado:** 📋 PLANIFICADO

**Alcance:**
- NO modificar código UI o gráficos de BATCH 1, 2, o 3
- NO modificar lógica del dashboard
- NO romper o reemplazar la configuración existente de Gemini + Vercel AI SDK
- NO refactorizar partes no relacionadas del repositorio
- Enfoque EXCLUSIVO en analytics toolkit y function calling

### Tareas Planificadas

#### 1. Corregir Error de TypeScript

**Archivo:** `src/app/api/chat/route.ts` (línea 69)

**Problema:**
- Error de tipo `CoreMessage` al asignar `raw.role`
- TypeScript no puede inferir que `raw.role` es un rol válido de `CoreMessage`

**Solución:**
- Agregar validación de roles válidos antes de la asignación
- Usar type guard para asegurar que solo roles válidos se asignen

#### 2. Extender Toolkit de Analytics

**Archivo:** `src/lib/ai-tools.ts`

**Nuevas Funciones:**

1. **`getTopProductsByKilos(args)`**
   - Parámetros: `{ year?: number; season?: string; country?: string; limit?: number }`
   - Retorna: Top N productos por kilogramos exportados
   - Usa DataEngine o filtrado directo del dataset
   - Retorna schema: `topProductsSchema`

2. **`getTrendByProduct(args)`**
   - Parámetros: `{ product: string; year?: number }`
   - Retorna: Series temporales anuales (año por año) para un producto específico
   - Usa DataEngine.getTimeSeriesByProduct o agrega por año
   - Retorna schema: `timeSeriesByProductSchema`

3. **`getExporterSummary(args)`**
   - Parámetros: `{ exporter: string; season?: string; product?: string }`
   - Retorna: Resumen KPIs de un exportador específico (boxes, kilos, share %, top country)
   - Usa DataEngine.getExporterKPIs
   - Retorna schema: `exporterSummarySchema`

**Extensión de Función Existente:**

4. **`getGlobalKPIs(filters?)`**
   - Agregar parámetros opcionales: `{ season?: string; year?: number; country?: string; product?: string; exporter?: string }`
   - Filtrar dataset antes de calcular KPIs
   - Mantener schema de retorno existente

#### 3. Crear Nuevos Schemas Zod

**Archivo:** `src/lib/ai-schemas.ts`

**Nuevos Schemas:**

- `topProductsSchema` - Para ranking de productos con items (rank, product, netWeightKg, boxes)
- `timeSeriesByProductSchema` - Para series temporales de productos con points (year, netWeightKg, boxes)
- `exporterSummarySchema` - Para resumen de exportadores (exporter, totalBoxes, totalKilos, globalSharePercent, topCountry)

#### 4. Actualizar Function Calling en Route

**Archivo:** `src/app/api/chat/route.ts`

**Cambios:**
- Importar nuevas funciones desde `ai-tools.ts`
- Importar nuevos schemas desde `ai-schemas.ts`
- Agregar nuevas herramientas al objeto `customTools`:
  - `getTopProductsByKilos`
  - `getTrendByProduct`
  - `getExporterSummary`
- Actualizar `getGlobalKPIs` tool para aceptar parámetros de filtro opcionales
- Asegurar que todas las herramientas tengan `description`, `parameters`, `execute`, y `experimental_output`

#### 5. Actualizar System Prompt

**Archivo:** `src/app/api/chat/route.ts`

**Actualizaciones a SYSTEM_MESSAGE:**
- Instrucciones para usar herramientas para rankings de productos, tendencias de productos, y resúmenes de exportadores
- Clarificación de que todos los datos deben venir de herramientas (sin alucinaciones)
- Ejemplos de cuándo usar cada tipo de herramienta
- Énfasis en que NO debe inventar números, exportadores, productos o países

### Herramientas Finales Disponibles para Gemini

Después de la implementación, Gemini tendrá acceso a:

1. `getGlobalKPIs` - KPIs globales con filtros opcionales
2. `getTopCountriesByKilos` - Ranking de países por kilogramos
3. `getTopExportersByKilos` - Ranking de exportadores por kilogramos
4. `getTopProductsByKilos` - Ranking de productos por kilogramos (NUEVA)
5. `getTimeSeriesByCountry` - Tendencias anuales por país
6. `getTrendByProduct` - Tendencias anuales por producto (NUEVA)
7. `getExporterSummary` - Resumen específico de exportador (NUEVA)

### Archivos a Modificar

1. `src/lib/ai-tools.ts` - Agregar 3 nuevas funciones, extender getGlobalKPIs
2. `src/lib/ai-schemas.ts` - Agregar 3 nuevos schemas
3. `src/app/api/chat/route.ts` - Corregir error TypeScript, agregar nuevas herramientas, actualizar system prompt

### Estrategia de Implementación

**Reutilización de Código:**
- Usar funciones existentes `getDataset()` y `getEngine()` para caché
- Aprovechar métodos de DataEngine donde sea posible (getTimeSeriesByProduct, getExporterKPIs)
- Para nuevas agregaciones, usar agrupación eficiente basada en Map similar a funciones existentes

**Manejo de Errores:**
- Validar parámetros de entrada (strings no vacíos, números válidos)
- Retornar mensajes de error significativos si no se encuentran datos
- Manejar casos edge (datasets vacíos, filtros inválidos)

**Logging:**
- Agregar `console.log` para debugging de llamadas a herramientas
- Seguir el patrón existente: `[TOOLS] functionName`

### Checklist de Testing

- [ ] TypeScript compila sin errores
- [ ] Todas las nuevas funciones retornan datos validados por schema
- [ ] Gemini puede llamar nuevas herramientas exitosamente
- [ ] Herramientas existentes siguen funcionando
- [ ] Chat UI muestra respuestas correctamente
- [ ] Manejo de errores funciona para inputs inválidos

---

**Última actualización:** 2025-01-27  
**Autor:** AI Assistant (Auto)  
**Revisión:** Fase 3 COMPLETADA ✅ + Mejoras Post-MVP ✅ + Chat AI con Function Calling ✅ + Internacionalización ✅ + Páginas Deep Dive ✅ + Refactor UI/UX BATCH 1 ✅ + BATCH 2 ✅ + BATCH 3 ✅ | PHASE 4 📋 PLANIFICADO

