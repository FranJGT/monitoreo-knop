# Arquitectura — Monitoreo Knop

## Visión general

```
Navegador (React/Next client)
   │  fetch /api/knop/*
   ▼
Next.js Route Handlers  (proxy + normalización + caché)
   │  fetch https://newenergy.softronica.cl/knop/monitoreo/*
   ▼
APIs PHP del cliente (sensores LoRaWAN)
```

La UI nunca llama directamente al proveedor: el proxy tipa, normaliza (floats de presión,
strings de termohigrómetro), arregla encoding y aplica `Cache-Control` / `revalidate`.

## Endpoints del proveedor (origen de datos)

Base: `https://newenergy.softronica.cl/knop/monitoreo/`

### Diferencial de Presión (SDP)
| Endpoint | Parámetros | Devuelve |
|----------|-----------|----------|
| `sdp/deviceDP.php` | — | `[{devEui, identificador, ubicacion, area, seccion, tipo_rango, label}]` |
| `sdp/kpiDP.php` | `devEui`, `preset`/`start`+`end`, `agg` | `[{bucket_time, last_datetime, Differential_pressure_Pa}]` |
| `sdp/rangoDP.php` | `devEui` | `{min_pa, max_pa, tipo_rango_dp, descripcion_rango, visible, …}` |

### Termohigrómetros (STH)
| Endpoint | Parámetros | Devuelve |
|----------|-----------|----------|
| `device.php` | — | `["CODE - Ubicacion", …]` |
| `kpiSTH.php` | `deviceName` (label completo), `preset`/`start`+`end`, `agg` | `[{bucket_time, tempC_SHT, hum_SHT, batV, tempC_DS}]` |
| `rangoSTH.php` | `deviceName` | `{identificador, tipo_rango_sth, temp_min, temp_max, hum_min, hum_max}` |

## Reglas de negocio

- Conversión presión: `1 inH₂O = 249.08891 Pa` (`lib/units.ts`).
- Agregación por periodo (min/bucket): `24h→5, 2d→5, 3d→5, 7d→15, 30d→60, 12m→1440`
  (`lib/aggregation.ts`). Rango personalizado estima `agg` según los días.
- Estado/estadística (`lib/stats.ts`): resumen mín/prom/máx, % cumplimiento dentro de rango,
  tiempo fuera de rango (`buckets fuera × agg`), tendencia (último tercio vs. previo) y
  alarmas con **histéresis** (se restablecen al volver dentro del 5% del rango).

## Proxy interno (`app/api/knop/*`)

| Ruta | Query | Origen |
|------|-------|--------|
| `/api/knop/devices` | `type=dp\|sth` | deviceDP / device |
| `/api/knop/kpi` | `type`, `id`, `preset\|start+end`, `agg` | kpiDP / kpiSTH |
| `/api/knop/rango` | `type`, `id` | rangoDP / rangoSTH |

Fetchers de servidor en `lib/knopApi.ts`; cliente tipado en `lib/knopClient.ts`;
tipos compartidos en `lib/knopTypes.ts`.

## Bitácora (`app/api/bitacora/*` + MySQL)

La bitácora no consume la API del cliente: persiste en **MySQL** (tabla
`bitacora_eventos`, ver `docs/database/migrations/001_bitacora_eventos.md`).

```
Navegador (React) → /api/bitacora/* → MySQL (pool en lib/db.ts, queries parametrizadas)
```

| Ruta | Método | Función |
|------|--------|---------|
| `/api/bitacora` | GET | Lista (filtros `tipo`, `texto`, `desde`, `hasta`; máx. 500, más recientes primero) |
| `/api/bitacora` | POST | Crear evento (validación server-side en `lib/bitacora.ts`) |
| `/api/bitacora/[id]` | PATCH | Editar evento (merge con estado actual) |

Reglas de negocio:

- **Sin DELETE** por diseño: es un registro de calidad; solo se edita.
- `fecha_hora` se guarda en hora local de Chile como `DATETIME` (`YYYY-MM-DD HH:mm:ss`);
  el formulario envía `datetime-local` y `normalizeFechaHora()` lo normaliza.
- Validación server-side en `lib/bitacora.ts`: tipo dentro de `EVENT_TYPES`, título y autor
  obligatorios, límites de longitud (título 200, autor/área 100).
- Conexión por variables de entorno (`MYSQL_*`, ver `.env.example`); pool único en
  `globalThis` para evitar fugas de conexión con el hot-reload de Next (`lib/db.ts`).
- Tipos compartidos cliente/servidor en `lib/bitacoraMeta.ts`; cliente en
  `lib/bitacoraClient.ts`; exportación Excel en `lib/bitacoraExport.ts` (patrón `exportXlsx`).

## Gráficos

ECharts vía wrapper `components/SensorChart.tsx` con tema Knop (`lib/echartsTheme.ts`).
Opciones por vista en `lib/charts/`: `dpOption`, `sthOption`, `dpReportOption`.
