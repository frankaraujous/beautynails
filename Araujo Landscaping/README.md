# Araujo’s Landscaping

PWA de ruta para la cuadrilla, estimados para el cliente y oficina para clientes, invoices, gastos y nómina.

```
Araujo Landscaping/
  docs/
  app/        puerto 4324
  api/        puerto 8085
  database/   MySQL `araujo_landscaping`
```

Arranque local, desde `app/`:

1. `npm install`
2. `npm run db:setup`
3. `npm run dev:api`
4. `npm run dev`

La ruta del día no pide contraseña. La oficina y los códigos de empleado se validan en la API. El prototipo HTML sigue en `docs/prototipo/`.
