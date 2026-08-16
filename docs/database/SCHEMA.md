# SCHEMA — Estado actual del esquema de base de datos

Base de datos: **MySQL** (provista por el cliente). Aplicación de migraciones en
`docs/database/migrations/`.

## Tablas

### `bitacora_eventos`

Bitácora de eventos del laboratorio (v2.0.0).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Identificador único |
| tipo_evento | VARCHAR(30) | NO | NULL | visita \| mantencion \| incidente \| calibracion \| otro |
| fecha_hora | DATETIME | NO | NULL | Fecha y hora del evento (hora local Chile) |
| titulo | VARCHAR(200) | NO | NULL | Título corto |
| descripcion | TEXT | SÍ | NULL | Detalle o contexto |
| area | VARCHAR(100) | SÍ | NULL | Sala/área afectada |
| autor | VARCHAR(100) | NO | NULL | Quién registra |
| creado_en | DATETIME | NO | CURRENT_TIMESTAMP | Creación |
| actualizado_en | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE | Última edición |

**Índices:** `idx_tipo` (tipo_evento), `idx_fecha` (fecha_hora).
**Regla de negocio:** sin borrado físico (registro de calidad); la API no expone DELETE.

*Última actualización: 2026-08-13 — v2.0.0*
