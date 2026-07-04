# Monitoreo · Knop Laboratorios

Plataforma web de monitoreo ambiental para áreas controladas de Knop Laboratorios.
Visualiza en tiempo real el **diferencial de presión**, la **temperatura** y la
**humedad** captados por sensores LoRaWAN, y genera informes de cumplimiento
exportables a Excel.

Construida con [Next.js 16](https://nextjs.org) (App Router), React 19,
TypeScript, Tailwind CSS 4 y [ECharts](https://echarts.apache.org).

## Características

- **Monitoreo de presión diferencial (SDP)** — serie temporal por dispositivo,
  con rangos válidos, estado y alarmas.
- **Monitoreo de termohigrómetros (STH)** — temperatura y humedad con sus rangos
  de cumplimiento por área.
- **Informe de cumplimiento** — KPIs, estado general, % de tiempo dentro de rango,
  tendencia y detección de alarmas con histéresis.
- **Exportación a Excel** — descarga de datos por periodo, idéntica al sistema
  original del cliente.
- **Periodos predefinidos** (24h, 2d, 3d, 7d, 30d, 12m) y **rango personalizado**,
  con agregación automática de datos según la ventana consultada.

## Arquitectura

La UI nunca llama directamente al proveedor de datos. Los *Route Handlers* de
Next.js (`app/api/knop/*`) actúan como proxy: tipan, normalizan y cachean las
respuestas de las APIs del cliente antes de servirlas al navegador.

```
Navegador (React) → /api/knop/* (proxy Next.js) → APIs del cliente (sensores LoRaWAN)
```

Para el detalle de endpoints, reglas de negocio (conversión de unidades,
agregación, estadística y alarmas) y organización de gráficos, ver
[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

### Estructura del proyecto

```
app/
  api/knop/            proxy interno (devices, kpi, rango)
  monitoreo/sdp/       vista de presión diferencial
  monitoreo/termohigrometros/  vista de temperatura y humedad
  informe/             informe de cumplimiento
components/            UI (gráficos, KPIs, controles, informe)
lib/                   lógica de negocio (API, stats, agregación, unidades, export)
lib/charts/            opciones de ECharts por vista
docs/                  arquitectura, documentación y reportes
scripts/               utilidades (verificación contra el sistema original)
```

## Desarrollo local

Requisitos: **Node.js 20+**.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run start    # sirve el build de producción
npm run lint     # linter (ESLint)
```

### Verificación de datos

`scripts/compare-knop.mjs` compara caso por caso que los datos y los Excel que
entrega la app coinciden con los del sistema original de Softronica (que consume
la misma API). Cubre DP y STH en los 6 periodos, rangos personalizados y un
barrido de todos los dispositivos.

```bash
node scripts/compare-knop.mjs   # genera docs/reporte-comparacion.md
```

## Documentación

- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — arquitectura y reglas de negocio.
- [`CHANGELOG.md`](CHANGELOG.md) — historial de cambios.
- [`docs/documentacion-sistema.pdf`](docs/documentacion-sistema.pdf) — documentación del sistema.
