# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y
versionamiento [SemVer](https://semver.org/lang/es/).

## [1.2.1] - 2026-06-24

### Fixed
- **Estado general coherente con el cumplimiento**: antes el estado usaba una banda de
  proximidad (8%) y podía marcar "Advertencia" con 100% de cumplimiento (confuso). Ahora:
  Normal = última lectura en rango y sin lecturas fuera; Advertencia = la actual está dentro
  pero hubo lecturas fuera en el periodo; Alerta = la lectura actual está fuera.

## [1.2.0] - 2026-06-24

### Added
- **Batería en el informe**: el informe de termohigrómetros muestra el voltaje de batería
  (`batV`, real desde `kpiSTH.php`), con aviso "(baja)" si < 3.4 V. En presión se indica
  "No disponible" (la API de presión no expone batería).
- Parámetro `?tipo=sth` en `/informe` para abrir directamente el informe de termohigrómetros.

### Changed
- **Informe en una sola hoja A4 al generar PDF**: layout de impresión compacto que fuerza las
  grillas a multi-columna (en print el ancho A4 las colapsaba), reduce alturas/espaciados y
  redibuja el gráfico al alto de impresión. Verificado con Chrome headless (`--print-to-pdf`):
  1 página para presión y termohigrómetro.

## [1.1.1] - 2026-06-23

### Fixed
- **Colisión de caché en producción (Netlify)**: el CDN cacheaba las respuestas de
  `/api/knop/*` por ruta ignorando el query string, lo que hacía que distintos sensores
  o tipos (DP/STH) devolvieran los datos del primero cacheado. Las rutas del proxy ahora
  responden `Cache-Control: no-store` (el upstream sigue cacheado server-side vía `revalidate`).

### Deployed
- Sitio en producción en Netlify (Next.js Runtime): https://superlative-truffle-37d616.netlify.app
  Repositorio: https://github.com/FranJGT/monitoreo-knop (auto-deploy en cada push a `main`).

## [1.1.0] - 2026-06-23

### Added
- **Informe para termohigrómetros**: toggle Presión / Termohigrómetro en `/informe`.
  Variante STH con KPIs de temperatura y humedad, estado general (peor de ambas métricas),
  4 alarmas con histéresis (T° y humedad, alta/baja) y estadísticas por métrica.
- Componentes reutilizables del informe (`components/report/*`: `DpReport`, `SthReport`,
  controles y piezas compartidas).

### Fixed
- **Bandas/límites de rango ahora visibles en los gráficos** (antes quedaban fuera de pantalla):
  - Termohigrómetros: eje Y único con `min:0` y máximo dinámico (como la página original);
    temperatura en verde y humedad en azul (colores distintos); líneas de rango siempre visibles.
  - Informe de presión: se quitó el zoom y el relleno verde que tapaba todo; líneas de límite
    mín/máx visibles y etiqueta de promedio sin recorte.

## [1.0.0] - 2026-06-22

### Added
- Proyecto inicial **Monitoreo · Knop Laboratorios** (Next.js 16 + TypeScript + Tailwind v4).
- Sistema de diseño on-brand (paleta verde Knop, tipografía con cifras tabulares, iconos Lucide).
- Capa de datos: proxy `/api/knop/{devices,kpi,rango}` que consume y normaliza las APIs
  del cliente (`deviceDP/kpiDP/rangoDP` y `device/kpiSTH/rangoSTH`).
- Página `/monitoreo/sdp` — Diferencial de Presión: selector de sensor, periodos (24h–12m),
  rango de fechas, gráfico ECharts con líneas de rango, conversión inH₂O, exportación Excel,
  auto-refresh 60 s.
- Página `/monitoreo/termohigrometros` — temperatura + humedad con doble eje y rangos de aceptación.
- Página `/informe` — informe estadístico: estado general, KPIs, % cumplimiento, tiempo fuera
  de rango, alarmas con histéresis, estadísticas e información del sensor; exportación a PDF (impresión).
- Utilidades: `lib/units` (Pa↔inH₂O, formato), `lib/aggregation` (preset→agg),
  `lib/stats` (resumen, cumplimiento, tendencia, histéresis), `lib/exportXlsx`.

### Notes
- Datos consumidos con autorización del cliente (Knop). El proxy desacopla la UI del
  proveedor actual y permite migrar a backend propio en el futuro.
