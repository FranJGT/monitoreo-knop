# Reporte de comparación — Knop (nuestra app vs sistema original)

**Generado:** 2026-07-01T16:52:57.774Z

**Total:** 165 casos · **Fallas:** 0 · **Avisos:** 0

> ✅ Sin diferencias de datos en ningún caso.

## DP-param

| Caso | Estado | Detalle |
|---|---|---|
| 24h | OK | preset+agg=5 |
| 2d | OK | preset+agg=5 |
| 3d | OK | preset+agg=5 |
| 7d | OK | preset+agg=15 |
| 30d | OK | preset+agg=60 |
| 12m | OK | preset+agg=1440 |

## STH-param

| Caso | Estado | Detalle |
|---|---|---|
| 24h | OK | nuestra=2026-06-30..2026-07-01/agg=null original=2026-06-30..2026-07-01/agg=null |
| 2d | OK | nuestra=2026-06-29..2026-07-01/agg=null original=2026-06-29..2026-07-01/agg=null |
| 3d | OK | nuestra=2026-06-28..2026-07-01/agg=null original=2026-06-28..2026-07-01/agg=null |
| 7d | OK | nuestra=2026-06-24..2026-07-01/agg=10 original=2026-06-24..2026-07-01/agg=10 |
| 30d | OK | nuestra=2026-06-01..2026-07-01/agg=30 original=2026-06-01..2026-07-01/agg=30 |
| 12m | OK | nuestra=2025-07-01..2026-07-01/agg=60 original=2025-07-01..2026-07-01/agg=60 |

## DP-vivo

| Caso | Estado | Detalle |
|---|---|---|
| A1-2/24h | OK | filas=240 spacing≈5min cols=bucket_time,last_datetime,Differential_pressure_Pa |
| A1-2/2d | OK | filas=528 spacing≈5min cols=bucket_time,last_datetime,Differential_pressure_Pa |
| A1-2/3d | OK | filas=816 spacing≈5min cols=bucket_time,last_datetime,Differential_pressure_Pa |
| A1-2/7d | OK | filas=657 spacing≈15min cols=bucket_time,last_datetime,Differential_pressure_Pa |
| A1-2/30d | OK | filas=716 spacing≈60min cols=bucket_time,last_datetime,Differential_pressure_Pa |
| A1-2/12m | OK | filas=224 spacing≈1440min cols=bucket_time,last_datetime,Differential_pressure_Pa |

## STH-vivo

| Caso | Estado | Detalle |
|---|---|---|
| AHP/24h | OK | filas=428 spacing≈5min |
| AHP/2d | OK | filas=715 spacing≈5min |
| AHP/3d | OK | filas=1003 spacing≈5min |
| AHP/7d | OK | filas=1076 spacing≈10min |
| AHP/30d | OK | filas=1462 spacing≈30min |
| AHP/12m | OK | filas=7827 spacing≈60min |

## DP-xlsx

| Caso | Estado | Detalle |
|---|---|---|
| A1-2/2026-06-20..2026-06-21 | OK | filas=575 agg=5 |
| A1-2/2026-06-16..2026-06-21 | OK | filas=576 agg=15 |
| A1-2/2026-06-01..2026-06-21 | OK | filas=503 agg=60 |
| A1-2/2026-04-22..2026-06-21 | OK | filas=47 agg=1440 |
| C3/2026-06-20..2026-06-21 | OK | filas=576 agg=5 |
| C3/2026-06-16..2026-06-21 | OK | filas=576 agg=15 |
| C3/2026-06-01..2026-06-21 | OK | filas=503 agg=60 |
| C3/2026-04-22..2026-06-21 | OK | filas=62 agg=1440 |

## STH-xlsx

| Caso | Estado | Detalle |
|---|---|---|
| AHP/2026-06-20..2026-06-21 | OK | filas=577 agg=def |
| AHP/2026-06-16..2026-06-21 | OK | filas=864 agg=10 |
| AHP/2026-06-01..2026-06-21 | OK | filas=1004 agg=30 |
| AHP/2026-04-22..2026-06-21 | OK | filas=1462 agg=60 |
| CBC/2026-06-20..2026-06-21 | OK | filas=577 agg=def |
| CBC/2026-06-16..2026-06-21 | OK | filas=864 agg=10 |
| CBC/2026-06-01..2026-06-21 | OK | filas=1000 agg=30 |
| CBC/2026-04-22..2026-06-21 | OK | filas=1085 agg=60 |

## DP-todos

| Caso | Estado | Detalle |
|---|---|---|
| A1-2 | OK | filas=384 |
| A2-2 | OK | filas=384 |
| A3 | OK | filas=384 |
| C1 | OK | filas=384 |
| C3 | OK | filas=384 |
| C4 | OK | filas=384 |
| C5 | OK | filas=384 |
| C6 | OK | filas=384 |
| CC3 | OK | filas=384 |
| CC4 | OK | filas=384 |
| CC9 | OK | filas=384 |
| D2 | OK | filas=384 |
| D3 | OK | filas=384 |
| D4 | OK | filas=384 |
| D5 | OK | filas=384 |
| D6 | OK | filas=384 |
| D7 | OK | filas=384 |
| E1 | OK | filas=384 |
| E3 | OK | filas=384 |
| E4 | OK | filas=384 |
| E5 | OK | filas=384 |
| E7 | OK | filas=384 |
| ES1 | OK | filas=384 |
| ES2 | OK | filas=384 |
| ES5 | OK | filas=384 |
| G1 | OK | filas=384 |
| G2 | OK | filas=384 |
| G3 | OK | filas=384 |
| I1 | OK | filas=384 |
| I11 | OK | filas=384 |
| I12 | OK | filas=384 |
| I13 | OK | filas=384 |
| I15 | OK | filas=384 |
| I18 | OK | filas=384 |
| I2 | OK | filas=384 |
| I3 | OK | filas=384 |
| I5 | OK | filas=384 |
| L1 | OK | filas=384 |
| L2 | OK | filas=384 |
| L3 | OK | filas=384 |
| L4 | OK | filas=384 |
| M1 | OK | filas=384 |
| M2 | OK | filas=384 |
| M3 | OK | filas=384 |
| M5 | OK | filas=384 |
| M6 | OK | filas=384 |
| M8 | OK | filas=384 |
| P10 | OK | filas=384 |
| P13 | OK | filas=384 |
| P14 | OK | filas=384 |
| P6 | OK | filas=384 |
| P7 | OK | filas=384 |
| S11 | OK | filas=384 |
| S12 | OK | filas=383 |
| S13 | OK | filas=384 |
| S14 | OK | filas=383 |
| S15 | OK | filas=384 |
| S16 | OK | filas=384 |
| S17 | OK | filas=384 |
| S2 | OK | filas=384 |
| S3 | OK | filas=384 |
| S4 | OK | filas=384 |
| S5 | OK | filas=384 |
| S6 | OK | filas=384 |
| S7 | OK | filas=384 |
| S8 | OK | filas=384 |
| SE1 | OK | filas=384 |
| SE2 | OK | filas=384 |
| SE3 | OK | filas=384 |
| SE4 | OK | filas=384 |
| SE5-1 | OK | filas=384 |
| SE5-2 | OK | filas=384 |
| UMA 1 | OK | filas=384 |
| UMA 10 | OK | filas=384 |
| UMA 11 | OK | filas=384 |
| UMA 12 | OK | filas=125 |
| UMA 13 | OK | filas=207 |
| UMA 17 | OK | filas=384 |
| UMA 18 | OK | filas=384 |
| UMA 18 | OK | filas=384 |
| UMA 18 | OK | filas=384 |
| UMA 2 | OK | filas=384 |
| UMA 3 | OK | filas=384 |
| UMA 4 | OK | filas=384 |
| UMA 5 | OK | filas=384 |
| UMA 6 | OK | filas=384 |
| UMA 7 | OK | filas=384 |
| VE 10.1 | OK | filas=384 |
| VE 10.28 | OK | filas=384 |
| VE 10.6 | OK | filas=384 |

## STH-todos

| Caso | Estado | Detalle |
|---|---|---|
| AHP | OK | filas=576 |
| AST | OK | filas=576 |
| B02 | OK | filas=576 |
| BCN | OK | filas=575 |
| BCS1 | OK | filas=561 |
| BIO | OK | filas=576 |
| BNE | OK | filas=576 |
| BSR | OK | filas=576 |
| C02 | OK | filas=576 |
| C03 | OK | filas=576 |
| C04 | OK | filas=576 |
| C07 | OK | filas=576 |
| CBC | OK | filas=576 |
| CBPT1 | OK | filas=576 |
| CBPT2 | OK | filas=576 |
| CBR | OK | filas=576 |
| CCM | OK | filas=576 |
| CPM | OK | filas=576 |
| CSB | OK | filas=576 |
| D4 | OK | filas=576 |
| D5 | OK | filas=576 |
| D6 | OK | filas=576 |
| E11 | OK | filas=576 |
| E2 | OK | filas=576 |
| E3 | OK | filas=575 |
| ES4 | OK | filas=0 |
| G2 | OK | filas=576 |
| G3 | OK | filas=576 |
| P6 | OK | filas=575 |
| P7 | OK | filas=483 |
| S16 | OK | filas=576 |
| S17 | OK | filas=576 |
| S8 | OK | filas=576 |
| S9 | OK | filas=576 |
| SE2 | OK | filas=576 |

