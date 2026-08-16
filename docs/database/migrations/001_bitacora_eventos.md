# Migración: 001 - Tabla bitacora_eventos

## Información General

- **Fecha:** 2026-08-13
- **Autor:** Fran
- **Versión:** v2.0.0
- **Tipo:** [MIGRATION]

## Descripción

Nueva tabla para la bitácora de eventos del dashboard de monitoreo. Registra
visitas, mantenciones, incidentes, calibraciones y eventos genéricos de las
áreas controladas, con fecha, responsable y detalle. Es un registro de calidad:
**no se permite borrar** registros (la API solo expone crear, listar y editar).

La base de datos es **MySQL** (servidor provisto por el cliente). La tabla puede
vivir en una base dedicada al dashboard o dentro de la base existente del
sistema de monitoreo; el usuario de la aplicación solo requiere permisos
`SELECT`, `INSERT` y `UPDATE` sobre esta tabla.

## Cambios en Tablas

### Tabla: `bitacora_eventos`

**Acción:** CREAR

#### Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Identificador único |
| tipo_evento | VARCHAR(30) | NO | NULL | visita \| mantencion \| incidente \| calibracion \| otro |
| fecha_hora | DATETIME | NO | NULL | Fecha y hora en que ocurrió el evento (hora local Chile) |
| titulo | VARCHAR(200) | NO | NULL | Título corto del evento |
| descripcion | TEXT | SÍ | NULL | Detalle o contexto |
| area | VARCHAR(100) | SÍ | NULL | Sala/área afectada (texto libre, p.ej. "Esclusa Bodega") |
| autor | VARCHAR(100) | NO | NULL | Nombre de quien registra el evento |
| creado_en | DATETIME | NO | CURRENT_TIMESTAMP | Fecha de creación del registro |
| actualizado_en | DATETIME | NO | CURRENT_TIMESTAMP ON UPDATE | Última edición |

### Índices

| Nombre | Tabla | Columnas | Tipo | Razón |
|--------|-------|----------|------|-------|
| idx_tipo | bitacora_eventos | tipo_evento | BTREE | Filtrar por tipo de evento |
| idx_fecha | bitacora_eventos | fecha_hora | BTREE | Ordenar cronológicamente y filtrar por rango |

## Scripts SQL

### UP (Aplicar)

```sql
CREATE TABLE bitacora_eventos (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_evento   VARCHAR(30)  NOT NULL,
  fecha_hora    DATETIME     NOT NULL,
  titulo        VARCHAR(200) NOT NULL,
  descripcion   TEXT         NULL,
  area          VARCHAR(100) NULL,
  autor         VARCHAR(100) NOT NULL,
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tipo (tipo_evento),
  KEY idx_fecha (fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### DOWN (Rollback)

```sql
DROP TABLE IF EXISTS bitacora_eventos;
```

## Impacto

- [x] Backend: nueva ruta `/api/bitacora` (GET, POST) y `/api/bitacora/[id]` (PATCH)
- [x] Frontend: nueva página `/bitacora` (timeline + filtros + formulario + exportación Excel)
- [ ] APIs externas: sin impacto (la bitácora no toca los endpoints de Softronica)
- [ ] Jobs/Cron: sin impacto

## Notas Adicionales

- `fecha_hora` se guarda en hora local de Chile (America/Santiago). El valor se
  recibe desde el formulario como `datetime-local` y se normaliza a
  `YYYY-MM-DD HH:mm:ss` antes de persistir.
- Se recomienda que el servidor MySQL esté configurado con zona horaria
  `America/Santiago` (o la hora local de Chile), igual que el servidor Node del
  dashboard, para que `creado_en`/`actualizado_en` (CURRENT_TIMESTAMP) se
  muestren en la misma hora local.
- El usuario de MySQL de la aplicación debe tener únicamente `SELECT`, `INSERT`
  y `UPDATE` sobre `bitacora_eventos` (sin `DELETE` ni `DROP`).
- Configuración de conexión por variables de entorno (ver `.env.example`).
