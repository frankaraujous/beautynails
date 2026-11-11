# Base `araujo_landscaping`

Local (XAMPP): host `127.0.0.1`, usuario `root`, contraseña vacía. Desde `app/` corre `npm run db:setup`.

En el servidor, crea la base en phpMyAdmin (`utf8mb4` / `utf8mb4_unicode_ci`) y ejecuta `schema.sql` y después `seed.sql`. En `api/config/db.php`:

- `host`: `localhost`
- `database`: el nombre del hosting
- `username`: `TU_USUARIO_MYSQL`
- `password`: `TU_PASSWORD`

No subas `db.php`. Fotos y firmas van a `api/storage/`.
