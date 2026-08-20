# Opciones de almacenamiento para informes PDF

**Estado:** guía de arquitectura para la decisión de despliegue
**Fecha de revisión de precios y límites:** 20 de agosto de 2026

Los precios, cuotas y límites de los proveedores cambian. Las cifras indicadas
son una referencia de las páginas oficiales consultadas en la fecha anterior y
deben confirmarse antes de contratar o desplegar.

## Contrato actual

La aplicación ya separa el contenido binario de los datos de la bitácora:

- `lib/bitacoraStorage.ts` define `FileStorage`, con operaciones de guardar,
  leer y eliminar contenido. La lógica de eventos no conoce el proveedor.
- MySQL conserva solamente metadatos: evento asociado, clave del objeto o
  `fileId`, nombre original, MIME, tamaño, usuario y fechas. La migración
  `docs/database/migrations/002_bitacora_archivos.md` crea esa tabla de forma
  aditiva y restringe un informe por evento.
- El adaptador disponible es local y privado para desarrollo. Su directorio se
  configura con `BITACORA_STORAGE_DIR` y por defecto es `storage/bitacora`.
  Esta carpeta está excluida del control de versiones.
- No se deben guardar archivos como `BLOB`, base64 ni valores binarios en
  `bitacora_archivos`.

En producción se cambia el adaptador y sus variables de configuración, no la
API de eventos. La implementación debe subir el archivo, confirmar el objeto,
guardar sus metadatos en MySQL y eliminar el objeto si falla la persistencia de
metadatos. La descarga debe comprobar autorización, resolver la clave y
transmitir el contenido sin hacerlo público por defecto.

### Por qué el adaptador local no basta en serverless

Un volumen local persistente funciona si el proceso corre en un servidor o
contenedor con un volumen administrado y respaldado. No es equivalente al disco
local de una función serverless: Netlify describe sus funciones como entornos
de ejecución efímeros. Los archivos escritos durante una invocación pueden
desaparecer cuando termina o cambia la instancia. Para ese escenario se debe
usar almacenamiento persistente externo o un volumen explícitamente contratado.

Fuentes: [Netlify Functions overview](https://docs.netlify.com/build/functions/overview/)
y [configuración de funciones](https://docs.netlify.com/build/functions/configuration/).

## Alternativas

### 1. Volumen local persistente

**Integración.** Implementar `FileStorage` sobre el filesystem actual y montar
un volumen fuera del árbol de despliegue. La clave puede seguir siendo el UUID
actual (`bitacora/<uuid>.pdf`).

**MySQL, acceso y búsqueda.** Guardar la ruta relativa, nunca una ruta absoluta,
junto con el resto de metadatos. Las autorizaciones siguen en la aplicación y
el sistema operativo debe limitar el acceso al directorio. La búsqueda se hace
por evento y metadatos en MySQL; el filesystem no ofrece indexación de texto de
PDF por sí solo.

**Persistencia, costo y operación.** Requiere volumen, snapshots, respaldo y
procedimientos de restauración. El costo depende del proveedor del servidor y
del tamaño del volumen; no hay una cuota gratuita universal. Es la opción más
simple para un servidor Linux único, pero crea dependencia de ese servidor y
complica escalar horizontalmente.

**Elegirlo cuando:** el despliegue es un servidor controlado, con pocos nodos,
volumen persistente y respaldo probado. No elegirlo para Netlify/serverless sin
un producto de volumen persistente explícito.

### 2. Google Drive

**Integración.** Crear un adaptador que use `files.create` con carga multipart o
resumable, dentro de una carpeta privada o un Shared Drive. Guardar el `fileId`
devuelto en `bitacora_archivos`; conservar en MySQL los metadatos necesarios
para que la bitácora no dependa de una búsqueda en Drive.

**Autenticación y permisos.** Requiere OAuth 2.0 con una cuenta de usuario o
una cuenta de servicio con acceso a la carpeta/Shared Drive. Las cuentas de
servicio no pueden ser propietarias de archivos; deben subir a un Shared Drive
o actuar en nombre de una persona. Configurar ACL mínima, no compartir
públicamente, rotar credenciales y guardar secretos sólo en el gestor de
secretos del despliegue.

**Búsqueda, descarga y resiliencia.** Drive permite consultar por nombre,
carpeta, MIME, `fullText` y `appProperties`; aun así, la aplicación debe usar
MySQL como índice primario por evento. `files.get` con `alt=media` sirve para la
descarga. El adaptador debe manejar 401/403/404, cuotas 403/429, reintentos con
backoff y cargas resumibles; no debe dejar un evento apuntando a un upload
incompleto.

**Persistencia, costo y operación.** La persistencia y el respaldo dependen de
la cuenta de Google Workspace/Drive, sus políticas de retención y su plan. La
API no tiene un costo por llamada en el uso estándar según la documentación,
pero existen cuotas y límites de almacenamiento del plan. Como referencia
actual, la API documenta 1 TB/día de salida por proyecto y límites de carga;
estos valores y las condiciones de facturación pueden cambiar.

**Ventajas:** indexación humana, permisos familiares y revisión manual fácil.
**Desventajas:** identidad, compartición, cuotas y operación de Google agregan
complejidad; no es un repositorio de objetos neutral para la aplicación.
**Elegirlo cuando:** existe una cuenta empresarial, una carpeta privada y se
valora que personas puedan buscar y revisar los informes en Drive. Es una buena
opción de piloto, no la recomendación provisional para almacenamiento de
aplicación a escala.

Fuentes: [subir archivos](https://developers.google.com/workspace/drive/api/guides/manage-uploads),
[buscar archivos](https://developers.google.com/workspace/drive/api/guides/search-files),
[permisos](https://developers.google.com/workspace/drive/api/guides/manage-sharing),
[límites de carpetas y cuentas de servicio](https://developers.google.com/workspace/drive/api/guides/folder),
y [cuotas de la API](https://developers.google.com/workspace/drive/api/guides/limits).

### 3. Amazon S3

**Integración.** Crear un adaptador con AWS SDK o API S3. Usar un bucket privado,
una clave inmutable basada en UUID y `PutObject`/`GetObject`/`DeleteObject`.
Para archivos mayores o redes inestables, usar multipart upload o URLs firmadas
con expiración corta. La tabla conserva la `key`, bucket lógico si aplica,
ETag opcional y metadatos de validación.

**Autenticación, búsqueda y respaldos.** Usar IAM con permisos mínimos sólo al
bucket/prefijo de Bitácora; nunca poner claves en el navegador. S3 no es un
buscador de contenido PDF: el índice de evento y metadatos permanece en MySQL.
Activar versionado, lifecycle y replicación o backup según el RPO/RTO requerido.

**Costo y operación.** El precio depende de almacenamiento, solicitudes,
recuperación y transferencia; AWS indica cobro por uso y sin cargo mínimo en la
página de S3, pero el cálculo final depende de región y clase. La operación es
media: hay que configurar IAM, bucket, cifrado, lifecycle, monitoreo y
respaldos.

**Ventajas:** estándar de facto, maduro, durable y con muchos adaptadores.
**Desventajas:** más decisiones y líneas de facturación que una solución
integrada. **Elegirlo cuando:** se busca una base de producción general y el
equipo ya opera AWS.

Fuente: [precios oficiales de Amazon S3](https://aws.amazon.com/s3/pricing/) y
[prácticas de seguridad de S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html).

### 4. Cloudflare R2

**Integración.** Usar el adaptador S3 con endpoint R2 y credenciales de API
limitadas al bucket. Guardar en MySQL la key y metadatos, igual que con S3;
mantener la interfaz independiente de la marca.

**Acceso, búsqueda y persistencia.** Bucket privado, claves separadas para
servidor y, si se requiere, URLs presignadas. El listado S3 no reemplaza el
índice MySQL ni extrae texto de PDF. Configurar lifecycle, versionado y una
política de respaldo externa si el informe es regulado.

**Costo y operación.** La página oficial consultada indica para la clase
Standard USD 0,015/GB-mes, sin cargo de egress a Internet, además de cargos por
operaciones; también muestra un nivel mensual incluido que puede cambiar. La
operación es baja-media: bucket, tokens, endpoint, cifrado y backups.

**Ventajas:** API S3, salida a Internet sin cargo según el modelo publicado y
buena opción multi-cloud. **Desventajas:** dependencia de Cloudflare y cargos
por operaciones/clase que deben modelarse. **Elegirlo cuando:** el equipo
quiere objeto S3-compatible y la transferencia de descarga pesa en el costo.

Fuente: [precios de Cloudflare R2](https://developers.cloudflare.com/r2/pricing/) y
[opciones de API de R2](https://developers.cloudflare.com/r2/get-started/).

### 5. Backblaze B2

**Integración.** Usar el SDK/API nativo o endpoint S3-compatible. Crear una
Application Key restringida al bucket y guardar `key` más metadatos en MySQL.
La descarga se realiza desde el servidor o mediante URL autorizada de corta
duración.

**Búsqueda, persistencia y respaldo.** La búsqueda de eventos se resuelve en
MySQL; B2 ofrece almacenamiento de objetos, no indexación de texto de PDFs.
Definir versionado, lifecycle y un segundo destino para respaldos si el
requisito lo exige.

**Costo y operación.** La página oficial consultada muestra almacenamiento
gratuito inicial de 10 GB, una tarifa publicada de referencia de USD 0,00695
por GB-mes sobre ese umbral y egress gratuito hasta un múltiplo del promedio
almacenado; solicitudes y egress adicional pueden cobrar. Confirmar la tarifa
vigente y el contrato. La complejidad es baja-media.

**Ventajas:** costo de almacenamiento atractivo y API compatible. **Desventajas:**
hay que revisar límites de transacciones, egress y soporte antes de un uso
crítico. **Elegirlo cuando:** se quiere almacenamiento de objetos económico sin
operar la infraestructura.

Fuente: [precios de transacciones de Backblaze B2](https://www.backblaze.com/cloud-storage/transaction-pricing)
y [documentación para desarrolladores](https://www.backblaze.com/cloud-storage/solutions/developers).

### 6. MinIO autohospedado

**Integración.** Usar el mismo adaptador S3 apuntando al endpoint MinIO. Guardar
la key y metadatos en MySQL. Las credenciales deben vivir en el servidor y
tener permisos mínimos por bucket.

**Búsqueda, persistencia y operación.** MinIO es S3-compatible, pero el equipo
administra discos, TLS, usuarios, capacidad, actualizaciones, monitoreo,
versionado, replicación y backups. El texto de PDFs continúa indexado por la
aplicación o un buscador separado, no por MySQL automáticamente.

**Costo y complejidad.** No hay una cuota gratuita administrada: el software
puede ejecutarse sobre infraestructura propia, pero discos, máquinas, energía,
soporte y operación tienen costo. La complejidad es alta. **Ventajas:** control
de datos, portabilidad y ausencia de dependencia de un proveedor de nube.
**Desventajas:** responsabilidad completa por disponibilidad, seguridad y
recuperación; revisar además las obligaciones de licencia de la edición usada.
**Elegirlo cuando:** el equipo quiere operar infraestructura compatible con S3
y tiene conocimientos/recursos para hacerlo.

Fuentes: [compatibilidad S3 de MinIO](https://min.io/product/s3-compatibility) y
[documentación de MinIO](https://docs.min.io/community/minio-object-store/).

### 7. Supabase Storage

**Integración.** Usar el cliente de Storage o su API S3-compatible con un bucket
privado. El adaptador guarda la ruta del objeto en MySQL y conserva allí la
relación con el evento; no es necesario mover la base de la bitácora a Postgres.

**Autenticación y búsqueda.** Las políticas se controlan con RLS sobre objetos,
o con una service key sólo en el servidor. La indexación de eventos y búsqueda
de PDFs sigue estando en MySQL o en un índice adicional. Usar URLs firmadas o
descarga server-side, nunca una service key en el cliente.

**Persistencia, costo y operación.** Como referencia de la página oficial
consultada, el plan Free incluye 1 GB de archivos, 5 GB de egress cacheado y
límite de carga de 50 MB; el plan Pro publica 100 GB incluidos y cobros por
exceso. Los planes, límites y pausas por inactividad pueden cambiar. La
complejidad es baja si ya se usa Supabase; de lo contrario introduce otro
proveedor y sus políticas.

**Ventajas:** buckets, CDN y permisos integrados. **Desventajas:** acoplamiento
al ecosistema Supabase para una función que hoy sólo necesita objetos. **Elegirlo
cuando:** ya existe Supabase Auth/Storage y se quiere centralizar autorización.

Fuentes: [Storage](https://supabase.com/docs/guides/storage),
[control de acceso](https://supabase.com/docs/guides/storage/security/access-control),
y [precios y límites](https://supabase.com/pricing).

## Matriz de decisión

| Alternativa | Esfuerzo del adaptador | Persistencia | Búsqueda de PDF | Operación | Encaje provisional |
|---|---:|---|---|---|---|
| Volumen local | Bajo | Depende del volumen y backups | MySQL/metadatos | Baja en un servidor; alta al escalar | Desarrollo o servidor único |
| Google Drive | Medio-alto | Cuenta, retención y políticas Drive | Buena indexación humana y `fullText` | Media-alta por identidad/cuotas | Piloto con cuenta empresarial |
| Amazon S3 | Medio | Alta, configurable con versionado/backups | MySQL/metadatos | Media | Producción general |
| Cloudflare R2 | Medio | Alta, con lifecycle/backups propios | MySQL/metadatos | Baja-media | Producción con egress relevante |
| Backblaze B2 | Medio | Alta, revisar política de respaldo | MySQL/metadatos | Baja-media | Producción sensible a costo |
| MinIO | Bajo por API, alto en operación | La administra el equipo | MySQL/metadatos | Alta | Sólo si se operará infraestructura |
| Supabase Storage | Medio | Gestionada por Supabase según plan | MySQL/metadatos | Baja si ya existe Supabase | Equipos ya basados en Supabase |

## Recomendación provisional

Mantener `FileStorage` como frontera estable y usar el adaptador local sólo para
desarrollo. Para un piloto, Google Drive es razonable si ya existe una cuenta
empresarial, una carpeta privada y se busca indexación/revisión humana. Para
almacenamiento de aplicación en producción, S3, R2 o B2 son opciones más
apropiadas y portables. MinIO queda reservado para un equipo que explícitamente
quiera operar infraestructura. Supabase encaja cuando ya es parte de la
arquitectura, no como requisito nuevo.

En todos los casos, MySQL conserva únicamente metadatos y la relación con el
evento. El proveedor almacena los bytes. No se deben guardar blobs ni base64 en
la tabla.

## Checklist para un futuro adaptador de Google Drive

1. Crear una carpeta privada o Shared Drive dedicado a informes de mantenimiento.
2. Elegir OAuth 2.0 o cuenta de servicio; si se usa cuenta de servicio, subir a
   Shared Drive o actuar en nombre de una cuenta humana.
3. Conceder permisos mínimos y rotar credenciales sin incluirlas en el repo ni
   en `.env` versionado.
4. Subir con carga resumible cuando corresponda y guardar el `fileId` sólo luego
   de confirmar la respuesta.
5. Persistir `fileId`, nombre, MIME, tamaño, usuario y fechas en MySQL; mantener
   `evento_id` único.
6. Implementar descarga server-side, autorización, errores 401/403/404,
   límites 403/429, backoff, idempotencia y limpieza ante fallos parciales.
7. Mantener MySQL como índice de la bitácora y usar Drive como almacenamiento,
   no como dependencia para listar todos los eventos.

La selección final de proveedor, cuenta, región, retención, respaldos y
credenciales requiere decisión del encargado técnico. Esta documentación no
conecta Google Drive ni fija un proveedor de producción.
