# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y
versionamiento [SemVer](https://semver.org/lang/es/).

## [1.5.0] - 2026-07-04

### Added
- **Estado de batería del termohigrómetro**: junto al voltaje se muestra ahora su traducción según
  el rango definido por el cliente — 3,6–3,3 V **Óptimo** (verde), 3,2–2,9 V **Normal** (ámbar),
  2,8 V hacia abajo **Reemplazo** (rojo). Nueva utilidad `batteryStatus()` en `lib/stats.ts`,
  visible en `/monitoreo/termohigrometros` (tarjeta "Batería · medición") y en el informe STH.

### Changed
- El informe STH deja de usar el sufijo "(baja)" con umbral fijo de 3,4 V; se reemplaza por la
  traducción de estado anterior.

## [1.4.0] - 2026-07-01

### Fixed
- **Gráficos en blanco al cargar (canvas de ancho 0)**. ECharts se inicializaba antes de que el
  layout flex/grid calculara el ancho del contenedor y el `ResizeObserver` no corregía ese primer
  render, dejando el `<canvas>` con `width: 0` (alto correcto) hasta que ocurría un *resize* manual.
  Afectaba a `/monitoreo/sdp`, `/monitoreo/termohigrometros` y sobre todo al gráfico del `/informe`
  (dentro de una grilla `lg:grid-cols-3`). `SensorChart` ahora ajusta el gráfico al *bounding box*
  real del contenedor tras el primer layout (`requestAnimationFrame`) y en cada actualización de
  opción, en vez de confiar solo en el `resize()` sin dimensiones. Verificado en carga fría: los
  tres gráficos se dibujan sin interacción del usuario.

### Added
- **Script de verificación `scripts/compare-knop.mjs`**: compara, caso por caso, que la información
  (datos + Excel) que entrega la app coincide con la del sistema original de Softronica, que consume
  la misma API. Replica la lógica de parámetros de ambos sistemas, golpea la API real y arma ambos
  Excel con SheetJS para compararlos celda por celda. Cubre **DP y STH × 6 periodos** + rangos
  personalizados + **barrido de todos los dispositivos** (91 DP + 34 STH). Genera
  `docs/reporte-comparacion.md`. **Resultado: 165 casos, 0 diferencias de datos.** Uso:
  `node scripts/compare-knop.mjs`.

## [1.3.0] - 2026-07-01

### Fixed
- **Termohigrómetros: los periodos 2d/3d/7d/30d/12m mostraban solo ~1 día**. El endpoint del
  cliente `kpiSTH.php` **ignora el parámetro `preset`** y devuelve solo la ventana por defecto;
  el sistema original siempre consulta por `start`/`end`. La app STH usaba `preset` (heredado del
  patrón de presión), por lo que al elegir cualquier periodo mayor a 24 h el gráfico y el Excel
  traían solo un día. Ahora el STH convierte el preset a rango de fechas (`presetRangeYmd`) y usa
  el mapeo de agregación del original (`AGG_MAP_STH`: 24h/2d/3d sin agg, 7d=10, 30d=30, 12m=60).
  Verificado dato por dato contra el sistema original en los 6 periodos (0 discrepancias).
- **Error de hidratación en `/informe`**: la fecha "Informe generado el …" se renderizaba con
  `new Date()` en servidor y cliente a la vez (segundos distintos → *hydration mismatch* en cada
  carga). Ahora se calcula solo en el cliente tras el montaje.

### Changed
- **Exportación a Excel idéntica al sistema original** (antes tenía columnas y nombres propios):
  - **Presión**: hoja `datos`, columnas crudas `bucket_time` / `last_datetime` /
    `Differential_pressure_Pa`; archivo `dp_<sensor>_<preset|inicio_fin>_<agg>min.xlsx`.
  - **Termohigrómetro**: hoja `datos`, columnas `time` (dd/mm/yyyy HH:mm) / `hum_SHT` /
    `tempC_SHT`; archivo `sensor_<sensor>_<inicio>_<fin>_<agg>min_<timestamp>.xlsx`.
  - `exportRowsToXlsx` acepta un parámetro `header` para fijar el orden exacto de columnas.
- `useSensorSeries` admite mapeos de agregación por tipo de sensor y conversión de preset a
  `start`/`end` (para endpoints que no respetan `preset`, como el STH). El de presión no cambia
  (su endpoint `kpiDP.php` sí respeta `preset`).

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
