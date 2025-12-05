# Inicio Rápido - AgroAnalytics Dashboard

## ✅ Estado: LISTO PARA EJECUTAR

## Ejecutar el Dashboard

```bash
cd dashboard
npm run dev
```

El dashboard estará disponible en: **http://localhost:3000**

## Configuración Opcional (Solo para Chat AI)

Si quieres usar el chat AI, crea un archivo `.env.local`:

```bash
cd dashboard
echo "OPENAI_API_KEY=tu_api_key_aqui" > .env.local
```

**Nota:** El dashboard funciona perfectamente sin la API key. Solo el chat AI no estará disponible.

## Verificación Pre-Ejecución

- ✅ Build exitoso
- ✅ Archivo Parquet verificado: `data/dataset_dashboard_ready.parquet` (17MB)
- ✅ Dependencias instaladas
- ✅ Estructura de archivos completa

## Características Disponibles

### Sin API Key (Funciona):
- ✅ Visualización de KPIs (Total cajas, kilos, promedio, registros)
- ✅ Gráfico temporal por temporada
- ✅ Rankings Top 5 (Exportadores y Productos)
- ✅ Diseño responsive

### Con API Key (Requiere .env.local):
- ✅ Chat AI con herramientas de análisis
- ✅ Consultas en lenguaje natural sobre los datos

## Solución de Problemas

### Error: "Cannot find module 'parquetjs-lite'"
```bash
cd dashboard
npm install
```

### Error: "No se pudo leer el archivo Parquet"
Verifica que el archivo existe en:
```
/Users/jpagrt/Documents/01 - VS Code/DataCL/data/dataset_dashboard_ready.parquet
```

### El dashboard carga pero no muestra datos
- Verifica que el archivo Parquet tiene datos
- Revisa la consola del navegador para errores
- Verifica que el servidor está ejecutándose correctamente

## Próximos Pasos

1. Ejecutar `npm run dev`
2. Abrir http://localhost:3000
3. Explorar los datos visualizados
4. (Opcional) Configurar API key para chat AI


