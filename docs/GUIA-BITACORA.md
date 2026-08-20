# Guía de uso — Bitácora de eventos

La bitácora registra los eventos del laboratorio: **visitas, mantenciones
programadas/correctivas,
incidentes, calibraciones** y eventos genéricos, con fecha, responsable y detalle.
Es un **registro de calidad**: los eventos se pueden crear y editar, pero **no se
pueden borrar**.

## Acceso

Entrar a la plataforma de monitoreo y hacer clic en **"Bitácora"** (menú
superior) o en la tarjeta **"Bitácora"** de la pantalla de inicio.

## Registrar un evento

1. Clic en el botón **"Nuevo registro"** (arriba a la derecha).
2. Completar el formulario:
   | Campo | Obligatorio | Notas |
   |-------|-------------|-------|
   | Tipo de evento | Sí | Visita, Mantención programada, Mantención correctiva, Incidente, Calibración u Otro |
   | Fecha y hora | Sí | Cuándo ocurrió el evento (hora local) |
   | Título | Sí | Máximo 200 caracteres |
   | Equipo STH / SDP | No | Selección desde los equipos reales de ambas fuentes; conserva texto histórico (máximo 100 caracteres) |
   | Quién registra | Sí | Nombre de la persona que anota (máximo 100 caracteres) |
   | Descripción | No | Detalle libre del evento |
   | Informe de mantenimiento | No | PDF, Word, Excel, PNG o JPG; máximo 10 MB. Se reemplaza al adjuntar uno nuevo. |
3. Clic en **"Registrar evento"**. Al guardar aparece un aviso verde de
   confirmación y el evento queda visible en la cronología.

## Editar un evento

Clic en el ícono de lápiz del evento. Se abre el mismo formulario con los datos
cargados; modificar y guardar. La bitácora muestra "Editado el …" cuando un
evento fue modificado.

> No existe opción de borrar: si un evento quedó mal registrado, edítalo y
> corrige la información.

## Consultar y filtrar

- **Cronología**: los eventos se ordenan del más reciente al más antiguo,
  agrupados por día (Hoy, Ayer, fecha…).
- **Filtrar por tipo**: chips superiores (Todos, Visitas, Mantenciones programadas,
  Mantenciones correctivas, Incidentes, Calibraciones, Otros y registros históricos).
- **Buscar**: caja de texto que busca en título, área, autor y descripción.
- **Limpiar filtros**: botón "Limpiar" (aparece solo cuando hay filtros activos).

## Exportar a Excel

Clic en **"Excel"** (arriba a la derecha): descarga los eventos visibles
(aplicando los filtros activos) como archivo `.xlsx` con columnas: fecha, tipo,
título, área, descripción y autor.

## Adjuntar y consultar un informe

En el formulario selecciona un archivo en **Informe de mantenimiento**. El
backend valida que la extensión y el MIME coincidan y limita el tamaño a 10 MB.
La bitácora conserva sólo metadatos en MySQL; el archivo se guarda mediante
`lib/bitacoraStorage.ts` fuera de la base. Cada tarjeta con adjunto muestra
**Ver informe** para consulta/descarga.

El adaptador local es sólo para desarrollo (`BITACORA_STORAGE_DIR`, por defecto
`storage/bitacora`). No es la decisión final de despliegue: producción debe
usar un volumen persistente o implementar el contrato `FileStorage` para S3,
MinIO, R2 u otro proveedor, sin cambiar la lógica de eventos.

## Mensajes y estados

| Situación | Qué se ve |
|-----------|-----------|
| Sin registros | Mensaje "Aún no hay registros" con botón para agregar el primero |
| Búsqueda sin resultados | "No hay resultados para tu búsqueda" con botón "Limpiar filtros" |
| Error de conexión a la base | Aviso con botón "Reintentar" |
| Campo obligatorio vacío | Mensaje rojo bajo el campo al guardar |

## Requisitos técnicos

- La bitácora guarda en una tabla MySQL (`bitacora_eventos`) configurada por
  variables de entorno `MYSQL_*` (ver `.env.example`).
- El usuario MySQL de la aplicación solo necesita permisos `SELECT`, `INSERT` y
  `UPDATE` sobre esa tabla.
- Fechas en hora local de Chile; se recomienda servidor MySQL con zona
  `America/Santiago` (ver `docs/database/migrations/001_bitacora_eventos.md`).
