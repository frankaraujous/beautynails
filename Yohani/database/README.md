# Base `yohani`

Local (XAMPP): host `127.0.0.1`, usuario `root`, contraseña vacía. Desde `app/` corre `npm run db:setup`. Eso crea la base, carga `schema.sql` y `seed.sql`, y copia `api/config/db.sample.php` a `api/config/db.php` si todavía no existe.

En el servidor, crea la base en phpMyAdmin con `utf8mb4` / `utf8mb4_unicode_ci` y ejecuta los dos SQL en ese orden. Luego edita `api/config/db.php`:

- `host`: `localhost`
- `database`: el nombre que asignó el hosting (no tiene que llamarse `yohani`)
- `username`: `TU_USUARIO_MYSQL`
- `password`: `TU_PASSWORD`

No subas `db.php`. Las fotos quedan en `api/storage/` en el mismo servidor.
