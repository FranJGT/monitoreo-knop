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
- **Bitácora de eventos** — registro de calidad (visitas, mantenciones, incidentes,
  calibraciones y eventos genéricos) con timeline, filtros, edición sin borrado y
  exportación a Excel. Persistencia en MySQL.

## Arquitectura

La UI nunca llama directamente al proveedor de datos. Los *Route Handlers* de
Next.js (`app/api/knop/*`) actúan como proxy: tipan, normalizan y cachean las
respuestas de las APIs del cliente antes de servirlas al navegador.

```
Navegador (React) → /api/knop/* (proxy Next.js) → APIs del cliente (sensores LoRaWAN)
```

La bitácora tiene su propia ruta de datos:

```
Navegador (React) → /api/bitacora/* → MySQL (tabla bitacora_eventos)
```

Para el detalle de endpoints, reglas de negocio (conversión de unidades,
agregación, estadística y alarmas) y organización de gráficos, ver
[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

### Estructura del proyecto

```
app/
  api/knop/            proxy interno (devices, kpi, rango)
  api/bitacora/        CRUD de la bitácora (listar, crear, editar)
  monitoreo/sdp/       vista de presión diferencial
  monitoreo/termohigrometros/  vista de temperatura y humedad
  informe/             informe de cumplimiento
  bitacora/            bitácora de eventos
components/            UI (gráficos, KPIs, controles, informe, bitácora)
lib/                   lógica de negocio (API, stats, agregación, unidades, export, db)
lib/charts/            opciones de ECharts por vista
docs/                  arquitectura, documentación y reportes
scripts/               utilidades (verificación contra el sistema original)
```

## Desarrollo local

Requisitos: **Node.js 20+** y acceso a una base de datos **MySQL** para la bitácora.

```bash
npm install
cp .env.example .env   # completar MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
npm run dev
```

La tabla `bitacora_eventos` se crea con el script `docs/database/migrations/001_bitacora_eventos.md`
(sección UP). Para desarrollo local puedes levantar MySQL con Docker:

```bash
docker run --name knop-mysql -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=knop_monitoreo -e MYSQL_USER=knop_bitacora \
  -e MYSQL_PASSWORD=knop -p 3306:3306 -d mysql:8
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue en servidor Linux

El proyecto es un Next.js estándar (App Router + route handlers): no requiere
Netlify ni ningún servicio serverless. Para producción:

1. Instalar Node.js 20+ (recomendado 22 LTS).
2. Configurar `.env` con las credenciales MySQL reales.
3. Compilar y servir:

```bash
npm ci
npm run build
npm run start   # puerto 3000 por defecto
```

4. Mantener el proceso activo con **pm2** (recomendado) o **systemd**:

```bash
# pm2
npm i -g pm2
pm2 start npm --name knop-monitoreo -- start
pm2 save && pm2 startup

# systemd (alternativa)
sudo systemctl enable --now knop-monitoreo.service
```

5. Exponer detrás de **nginx** o **Caddy** con HTTPS:

```nginx
server {
  listen 443 ssl;
  server_name monitoreo.knoplabs.cl;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

El servidor necesita salida a internet para consumir la API de Softronica
(`newenergy.softronica.cl`) y acceso de red al MySQL donde vive `bitacora_eventos`.

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
- [`docs/GUIA-BITACORA.md`](docs/GUIA-BITACORA.md) — guía de uso de la bitácora (registrar, editar, filtrar, exportar).
- [`docs/database/SCHEMA.md`](docs/database/SCHEMA.md) — estado actual del esquema de base de datos.
- [`CHANGELOG.md`](CHANGELOG.md) — historial de cambios.
- [`docs/documentacion-sistema.pdf`](docs/documentacion-sistema.pdf) — documentación del sistema.
