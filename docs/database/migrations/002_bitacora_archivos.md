# Migración 002 — Adjuntos de la bitácora

Aplicar después de `001_bitacora_eventos.md`.

```sql
CREATE TABLE bitacora_archivos (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id       BIGINT UNSIGNED NOT NULL,
  clave           VARCHAR(500) NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  mime_type       VARCHAR(120) NOT NULL,
  tamano          INT UNSIGNED NOT NULL,
  subido_por      VARCHAR(100) NOT NULL,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_archivo_evento (evento_id),
  CONSTRAINT fk_archivo_evento FOREIGN KEY (evento_id) REFERENCES bitacora_eventos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

La aplicación guarda el contenido fuera de MySQL mediante `FileStorage` en
`lib/bitacoraStorage.ts`. El adaptador local es privado para desarrollo y usa
`BITACORA_STORAGE_DIR`; no es una decisión de despliegue. Para producción se
debe montar un volumen persistente o implementar el mismo contrato para S3,
MinIO, R2 u otro proveedor, sin cambiar la lógica de eventos.

La API valida extensión/MIME, limita a 10 MB, crea claves UUID no predecibles y
permite un informe por evento. `GET /api/bitacora/:id` entrega el informe
asociado en línea para consulta/descarga.
