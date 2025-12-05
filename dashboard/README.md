# AgroAnalytics Dashboard

Dashboard interno para visualización y análisis de datos de exportaciones agrícolas.

## Stack Tecnológico

- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Recharts** (Visualización)
- **Vercel AI SDK** (Chat AI)
- **parquetjs-lite** (Lectura de Parquet)

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto `dashboard/`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=tu_api_key_de_gemini_aqui
# Opcional: controla la carga del dataset
# DATA_CACHE_MAX_CHUNK_BYTES=536870912   # 512MB por defecto
# DATA_CACHE_ROW_LIMIT=250000            # Límite de registros a leer desde Python
# DATA_CACHE_SELECT_COLUMNS=true         # Limita las columnas leídas a las necesarias por el dashboard
# DATA_DASHBOARD_PATH=/ruta/a/tu/dataset.parquet  # Override opcional del parquet usado por el dashboard
# DATA_PYTHON_BIN=/Users/jpagrt/Documents/01\ -\ VS\ Code/DataCL/venv/bin/python  # Intérprete con Polars instalado
```

**Variables disponibles**

- `DATA_CACHE_MAX_CHUNK_BYTES`: Límite de bytes permitidos al stream de Python antes de abortar (por defecto 512 MB). Auméntalo solo si el servidor tiene memoria suficiente.
- `DATA_CACHE_ROW_LIMIT`: Corta el dataset directamente en Python para escenarios donde no necesitas todo el histórico (útil para entornos locales).
- `DATA_CACHE_SELECT_COLUMNS`: Si se establece en `true`, solo se leen las columnas requeridas por `ExportRecord`, reduciendo memoria y ancho de banda.
- `DATA_DASHBOARD_PATH`: Ruta absoluta al archivo Parquet a consumir (por defecto apunta al dataset MVP de 5 temporadas).
- `DATA_PYTHON_BIN`: Ruta al intérprete de Python que ejecutará Polars (útil si `python3` del sistema no tiene las dependencias instaladas).
- `GOOGLE_SAFETY_SETTINGS`: JSON opcional para sobreescribir los thresholds de seguridad de Gemini. Si no se define usamos un set conservador (block `MEDIUM_AND_ABOVE`).
- `GOOGLE_STRUCTURED_OUTPUTS`: `true|false`. Habilita/deshabilita las respuestas estructuradas del proveedor (por defecto `true`).
- `GOOGLE_THINKING_BUDGET`, `GOOGLE_THINKING_LEVEL`, `GOOGLE_THINKING_INCLUDE_THOUGHTS`: Ajustan el modo “thinking” de Gemini 2.5/3.0 (ver documentación oficial).
- `GOOGLE_RESPONSE_MODALITIES`: Lista separada por comas (`TEXT,IMAGE`) para solicitar salidas multimodales.
- `GOOGLE_CACHED_CONTENT`: ID de contenido cacheado para aprovechar el caching explícito de Gemini.
- `GOOGLE_SEARCH_ENABLED`: Activa la herramienta nativa `google_search` para grounding en tiempo real.
- `GOOGLE_SEARCH_RETRIEVAL_ENABLED`: Habilita el modo `google_search_retrieval` (Google recupera chunks completos además de las citas).
- `GOOGLE_URL_CONTEXT_ENABLED`: Permite que Gemini consuma URLs específicas mediante `url_context`.
- `GOOGLE_CODE_EXECUTION_ENABLED`: Habilita el tool `code_execution` para cálculos complejos en Python.
- `GOOGLE_FILE_SEARCH_STORES`: Lista separada por comas de stores de File Search (`projects/.../locations/.../fileSearchStores/...`). Si se define se habilita la herramienta `file_search`.
- `GOOGLE_FILE_SEARCH_TOP_K`, `GOOGLE_FILE_SEARCH_METADATA_FILTER`: Parámetros adicionales para File Search.

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

El dashboard estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/          # Endpoint de chat AI
│   │   └── page.tsx           # Página principal (Server Component)
│   ├── components/
│   │   └── dashboard/         # Componentes del dashboard
│   ├── lib/
│   │   ├── data-engine.ts     # Motor de procesamiento de datos
│   │   └── parquet-loader.ts  # Carga de datos desde Parquet
│   └── types/
│       └── exports.ts          # Definiciones TypeScript
```

## Características

### Visualizaciones

- **KPIs Globales**: Total de cajas, kilos, peso unitario promedio, registros
- **Gráfico Temporal**: Evolución por temporada usando `absolute_season_week`
- **Rankings**: Top 5 Exportadores y Top 5 Productos

### Chat AI

El dashboard incluye un asistente AI (Me-Vi) que puede:
- Responder preguntas sobre los datos
- Filtrar datos por temporada, país, producto, exportador
- Calcular KPIs y rankings
- Obtener valores únicos de columnas

Dentro del panel del chat encontrarás un botón de “Opciones avanzadas” que permite fijar instrucciones adicionales del sistema para cada conversación (por ejemplo tono, idioma o formato de salida). Esas instrucciones se envían como mensajes `system` adicionales y permanecen ocultas para el resto de usuarios.

## Datos

Por defecto el dashboard usa el dataset reducido:
```
/Users/jpagrt/Documents/01 - VS Code/DataCL/data/dataset_dashboard_mvp.parquet
```

Puedes alternar a otro archivo (ej. el dataset completo) configurando `DATA_DASHBOARD_PATH` en `.env.local`.

## Notas Importantes

1. **Ruta Absoluta**: El loader usa una ruta absoluta al archivo Parquet. Ajusta `src/lib/parquet-loader.ts` si cambia la ubicación.

2. **Ordenamiento Crítico**: El gráfico temporal depende del ordenamiento por `absolute_season_week` para mostrar continuidad temporal.

3. **Server Components**: La carga de datos se hace en Server Components para mejor performance.

4. **API Key**: Necesitas una API key de Google Gemini para usar el chat AI. Obtén tu key en [Google AI Studio](https://aistudio.google.com/apikey).

## Desarrollo

### Build para Producción

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Pruebas rápidas del chat

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"¿Cuál es el mayor exportador de uvas?"}]}'
```

Durante la prueba revisa la terminal de Next.js: deberías ver los logs `[CHAT][STEP] ...` con el consumo de tokens y el nombre de cada herramienta invocada.

## Próximos Pasos

- [ ] Agregar filtros interactivos
- [ ] Exportar datos a CSV/Excel
- [ ] Más tipos de gráficos
- [ ] Comparación entre temporadas
- [ ] Análisis de tendencias
