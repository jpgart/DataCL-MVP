# Plan: Fase 3 - Dashboard Next.js (AgroAnalytics MVP)

## Estado: 🚧 EN PROGRESO

**Fecha de inicio:** 2024-12-02  
**Última actualización:** 2024-12-02

---

## Objetivo
Construir MVP de "AgroAnalytics" (Dashboard Interno) que permita visualizar y analizar los datos de exportaciones procesados por el pipeline de Python.

## Stack Tecnológico
- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **AI:** Vercel AI SDK
- **Visualización:** Recharts
- **Estilos:** TailwindCSS
- **Datos:** Parquet (parquetjs-lite)

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

## Fases de Implementación

### FASE 0: ARQUITECTURA DE CARPETAS Y RUTAS
**Objetivo:** Establecer la estructura base del proyecto sin tocar el código Python existente.

**Tareas:**
- [ ] Verificar que `data/dataset_dashboard_ready.parquet` existe
- [ ] Crear carpeta `dashboard/` en la raíz del proyecto
- [ ] Documentar la arquitectura y rutas de acceso a datos

### FASE 1: SCAFFOLDING & CONFIGURACIÓN
**Objetivo:** Inicializar la aplicación Next.js con todas las configuraciones necesarias.

**Tareas:**
- [ ] Ejecutar `npx create-next-app@latest dashboard` con configuración:
  - TypeScript: Sí
  - ESLint: Sí
  - Tailwind CSS: Sí
  - src/ directory: Sí
  - App Router: Sí (Next.js 15)
  - Import alias: @/*
- [ ] Instalar dependencias:
  - `parquetjs-lite` (lectura de Parquet)
  - `recharts` (gráficos)
  - `lucide-react` (iconos)
  - `clsx` y `tailwind-merge` (utilidades CSS)
  - `zod` (validación)
  - `ai` y `@ai-sdk/openai` (Vercel AI SDK)
- [ ] Crear estructura de carpetas:
  - `src/lib/` (lógica de datos)
  - `src/components/dashboard/` (componentes visuales)
  - `src/types/` (definiciones TypeScript)
- [ ] Configurar import alias `@/*` en `tsconfig.json`

### FASE 2: DEFINICIÓN DE TIPOS (CONTRATO)
**Objetivo:** Establecer los contratos de datos TypeScript que coinciden con el schema del Parquet.

**Tareas:**
- [ ] Crear `src/types/exports.ts` con:
  - `ExportRecord` interface (coincide con schema del Parquet)
  - `KPIResult` interface (métricas agregadas)
  - `FilterState` interface (estado de filtros)
- [ ] Validar que los tipos coinciden con el dataset generado por Python

### FASE 3: CAPA DE DATOS (SERVER SIDE)
**Objetivo:** Implementar la carga y procesamiento de datos desde el archivo Parquet.

**Tareas:**
- [ ] Crear `src/lib/parquet-loader.ts`:
  - Función `loadParquetData()` que lee el Parquet
  - Ruta absoluta: `/Users/jpagrt/Documents/01 - VS Code/DataCL/data/dataset_dashboard_ready.parquet`
  - Conversión correcta de tipos (Number(), Boolean())
  - Manejo de errores
- [ ] Crear `src/lib/data-engine.ts`:
  - Clase `DataEngine` que recibe array de datos
  - Método `getTimeSeriesData()`:
    - Agrupa por `absolute_season_week`
    - Pivotea temporadas (season) como columnas
    - Ordena por `absolute_season_week` ascendente (CRÍTICO)
  - Métodos adicionales para KPIs y filtros

### FASE 4: VISUALIZACIÓN
**Objetivo:** Crear los componentes de dashboard con gráficos interactivos.

**Tareas:**
- [ ] Crear `src/app/page.tsx`:
  - Server Component que llama a `loadParquetData()`
  - Pasa datos a componente cliente `<SmartDashboard>`
- [ ] Crear `src/components/dashboard/smart-dashboard.tsx`:
  - Componente cliente que recibe `initialData`
  - Layout del dashboard
- [ ] Crear gráficos con Recharts:
  - `LineChart` (Evolución temporal):
    - Eje X: `absolute_season_week`
    - Series: Temporadas (season)
    - Tooltip que decodifica a "Semana Real"
  - `BarChart` (Rankings):
    - Top 5 Exportadores
    - Top 5 Productos
- [ ] Crear componentes de KPIs:
  - Total de cajas
  - Total de kilos
  - Promedio de peso unitario
  - Conteo de registros

### FASE 5: INTELIGENCIA ARTIFICIAL (Vercel AI SDK)
**Objetivo:** Integrar chat AI que puede analizar los datos usando herramientas.

**Tareas:**
- [ ] Crear `src/app/api/chat/route.ts`:
  - Endpoint POST usando `streamText` de `ai`
  - System prompt: "Eres Me-Vi, un auditor experto..."
  - Herramientas para filtrar y sumar datos
- [ ] Crear `src/components/dashboard/ai-chat.tsx`:
  - Usa hook `useChat` de Vercel AI SDK
  - Panel lateral o flotante
  - Renderiza conversación
- [ ] Implementar herramientas AI:
  - Filtrar por año, país, producto, exportador
  - Calcular totales y promedios
  - Generar rankings

## Lista de Verificación (Auditoría)

- [ ] ¿El proyecto Next.js está aislado en la carpeta `dashboard/`?
- [ ] ¿La lectura del Parquet apunta a la ruta absoluta correcta?
- [ ] ¿Los tipos numéricos se fuerzan con `Number()` al leer el parquet?
- [ ] ¿El gráfico temporal usa `absolute_season_week` para el eje X?
- [ ] ¿El ordenamiento por `absolute_season_week` está implementado?
- [ ] ¿Los componentes están correctamente separados (Server vs Client)?
- [ ] ¿El AI puede acceder y analizar los datos correctamente?

## Notas Importantes

1. **No tocar código Python:** El proyecto DataCL existente debe permanecer intacto
2. **Ruta absoluta:** Usar ruta absoluta al Parquet para conexión directa
3. **Ordenamiento crítico:** El gráfico temporal depende del ordenamiento por `absolute_season_week`
4. **Server Components:** Usar Server Components para carga de datos inicial
5. **Client Components:** Usar Client Components solo donde sea necesario (interactividad, hooks)

## Próximos Pasos

Una vez completada esta fase, el dashboard estará listo para:
- Visualización interactiva de datos
- Análisis con IA
- Expansión con más gráficos y métricas

