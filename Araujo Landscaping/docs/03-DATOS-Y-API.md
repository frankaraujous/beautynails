# Datos y API — Araujo’s Landscaping

## Tablas

- `clientes`: contacto, dirección, latitud, longitud, servicio, precio, frecuencia, día, paridad de semana, activo.
- `cuadrillas` y `empleados`.
- `empleado_cuadrillas`: hasta dos cuadrillas por persona.
- `estimados` y `estimado_partidas`. Estados: borrador, enviado, firmado, terminado, facturado.
- `invoices`, `invoice_partidas`, `invoice_costos`. Estados: por-cobrar, pagado. Origen: estimado o ruta.
- `visitas`: fotos y empleado del día.
- `fichajes`: entrada, salida y coordenadas.
- `gastos`.
- `ruta_dia`: cuadrilla elegida para una fecha.
- `ajustes` y `sesiones`.

La nómina no se guarda. Se calcula al pedir la semana.

## Endpoints

| Ruta | Uso |
| --- | --- |
| `GET /v1/health.php` | Salud |
| `GET /v1/ruta.php` | Paradas, mapa y cuadrilla |
| `POST /v1/ruta.php` | Cuadrilla del día |
| `POST /v1/fichaje.php` | Entrada o salida |
| `POST /v1/visita.php` | Foto de inicio o fin; el fin puede crear invoice |
| `POST /v1/auth/codigo.php` | Código de empleado o ver a todos |
| `GET /v1/estimados/buscar.php` | Teléfono del cliente |
| `POST /v1/estimados/firmar.php` | Firma |
| `POST /v1/auth/oficina.php` | Entrar a oficina |
| `GET/POST /v1/oficina/resumen.php` | KPIs y meta |
| `GET/POST /v1/oficina/clientes.php` | Carpeta de clientes |
| `GET/POST /v1/oficina/estimados.php` | Estimados e invoices de ese flujo |
| `GET/POST /v1/oficina/cuadrilla.php` | Cuadrillas y empleados |
| `GET/POST /v1/oficina/finanzas.php` | Libro, gastos y cobro |
| `GET /v1/oficina/nomina.php` | Nómina de la semana |
| `GET /v1/media.php` | Foto o firma |

Oficina pide `X-App-Token`.
