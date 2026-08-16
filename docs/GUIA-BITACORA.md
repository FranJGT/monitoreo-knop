# Guía de uso — Bitácora de eventos

La bitácora registra los eventos del laboratorio: **visitas, mantenciones,
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
   | Tipo de evento | Sí | Visita, Mantención, Incidente, Calibración u Otro |
   | Fecha y hora | Sí | Cuándo ocurrió el evento (hora local) |
   | Título | Sí | Máximo 200 caracteres |
   | Área / sala | No | Ej: "Esclusa Bodega" (máximo 100 caracteres) |
   | Quién registra | Sí | Nombre de la persona que anota (máximo 100 caracteres) |
   | Descripción | No | Detalle libre del evento |
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
- **Filtrar por tipo**: chips superiores (Todos, Visitas, Mantenciones,
  Incidentes, Calibraciones, Otros).
- **Buscar**: caja de texto que busca en título, área, autor y descripción.
- **Limpiar filtros**: botón "Limpiar" (aparece solo cuando hay filtros activos).

## Exportar a Excel

Clic en **"Excel"** (arriba a la derecha): descarga los eventos visibles
(aplicando los filtros activos) como archivo `.xlsx` con columnas: fecha, tipo,
título, área, descripción y autor.

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
