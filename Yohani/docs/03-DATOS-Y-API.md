# Datos y API — Yohani

## Tablas

- `servicios` y su precio.
- `disponibilidad`: fecha y hora de una hora.
- `dias_libres`.
- `citas`: nombre, teléfono, servicio, pago, color, código de transferencia, fecha, hora, dos fotos, alergia, confirmada, terminada, monto.
- `gastos`: material, monto, fecha.
- `ajustes`: hash de la contraseña, secuencia `AM-`, teléfono de texto, enlace Zelle.
- `sesiones`.

No hay tabla de clientas. Salen de las citas terminadas, agrupadas por los dígitos del teléfono.

## Endpoints

| Ruta | Uso |
| --- | --- |
| `GET /v1/health.php` | Salud y `SELECT 1` |
| `GET /v1/publico.php` | Servicios, 30 días, galería |
| `POST /v1/citas.php` | Reservar |
| `POST /v1/auth/login.php` | Entrar |
| `GET /v1/admin/panel.php` | Agenda, historial, precios, gastos, clientas |
| `POST /v1/admin/cita.php` | Confirmar, cancelar, terminar, corregir monto |
| `POST /v1/admin/horario.php` | Abrir o cerrar hora, día libre |
| `POST /v1/admin/gasto.php` | Alta o baja de gasto |
| `POST /v1/admin/precio.php` | Precio de un servicio |
| `GET /v1/media.php` | Foto guardada |

Las rutas de admin piden `X-App-Token`.
