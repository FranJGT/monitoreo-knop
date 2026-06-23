# Monitoreo · Knop Laboratorios

Plataforma web de monitoreo ambiental para áreas controladas de **Knop Laboratorios**:
réplica de alta calidad de las páginas de monitoreo del proveedor + un **informe
estadístico** que antes no existía.

Construido con **Next.js 16 (App Router) + TypeScript + Tailwind v4**, gráficos con
**ECharts**, desplegable en **Vercel**.

## Vistas

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio / acceso a las tres vistas |
| `/monitoreo/sdp` | **Diferencial de Presión** (Pa / inH₂O) con rango operacional y exportación a Excel |
| `/monitoreo/termohigrometros` | **Termohigrómetros** (temperatura + humedad, doble eje) con rangos de aceptación |
| `/informe` | **Informe estadístico**: estado general, KPIs, cumplimiento, tiempo fuera de rango, alarmas con histéresis, exportación a PDF |

## Datos

Los datos provienen de las APIs públicas del sistema del cliente
(`newenergy.softronica.cl/knop/monitoreo/`, sensores LoRaWAN). La app no llama esas APIs
directamente desde el navegador: un **proxy en Next.js** (`/api/knop/*`) las consume,
normaliza tipos y aplica caché.

- `deviceDP.php` / `device.php` → lista de sensores
- `kpiDP.php` / `kpiSTH.php` → series temporales agregadas
- `rangoDP.php` / `rangoSTH.php` → rangos operacionales

Detalle en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
npm run lint
```

## Identidad visual

Sistema de diseño anclado en la marca real de Knop (verdes corporativos `#09612D` /
`#5FE500`), tipografía con cifras tabulares, iconografía de línea (Lucide). Tokens en
[app/globals.css](app/globals.css).

## Estructura

```
app/                  rutas (UI + /api/knop proxy)
components/           UI compartida (toolbar, charts, KPIs, header)
lib/                  cliente de datos, estadística, unidades, opciones de gráficos
public/brand/         logotipo de Knop
docs/                 documentación
```
