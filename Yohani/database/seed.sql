SET NAMES utf8mb4;
SET time_zone = '-07:00';

INSERT INTO ajustes (clave, valor) VALUES
  ('admin_password_hash', '$2y$10$SNEHpfpFZ50mALZmiULs0OqVfIphX7OilL9JW8LMYOuh/QJyC7r0K'),
  ('transfer_seq', '327'),
  ('text_to', '4084447570'),
  ('zelle_url', 'https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiWW9oYW5pIiwidG9rZW4iOiI0MDg0NzI3NTcwIn0='),
  ('instagram', 'saira8758');

INSERT INTO servicios (nombre, precio, orden) VALUES
  ('Acrílico', 0, 1),
  ('Gel', 0, 2),
  ('Nail art', 0, 3),
  ('Retiro', 0, 4),
  ('Uñas de los pies', 0, 5);

INSERT INTO citas (nombre, telefono, servicio, pago, color, codigo_transferencia, fecha, hora, creada_en, confirmada, terminada, monto) VALUES
  ('Lucía Morales', '408-555-0191', 'Gel', 'Efectivo', '#ff3d8e', '', CURDATE(), '10:00:00', NOW(), 0, 0, NULL),
  ('Camila Ortega', '408-555-0174', 'Acrílico', 'Transferencia', '#c8102e', 'AM-0323', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', NOW(), 1, 0, NULL),
  ('Sofía Reyes', '669-555-0133', 'Nail art', 'Efectivo', '#6a35d9', '', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', NOW(), 0, 0, NULL),
  ('Valentina Cruz', '408-555-0160', 'Acrílico', 'Efectivo', 'own', '', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '13:00:00', NOW(), 1, 0, NULL),
  ('Mariana López', '831-555-0188', 'Retiro', 'Transferencia', '#f6c945', 'AM-0324', DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:00:00', NOW(), 0, 0, NULL),
  ('Elena Vargas', '408-555-0127', 'Acrílico', 'Efectivo', '#161616', '', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00', NOW(), 0, 0, NULL),
  ('Prueba Acrílico', '408-555-0101', 'Acrílico', 'Efectivo', '#f7d6e4', '', DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', NOW(), 0, 0, NULL),
  ('Prueba Gel', '408-555-0102', 'Gel', 'Efectivo', '#7bc142', '', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:00:00', NOW(), 0, 0, NULL),
  ('Prueba Nail art', '408-555-0103', 'Nail art', 'Efectivo', '#2a6bff', '', DATE_ADD(CURDATE(), INTERVAL 8 DAY), '12:00:00', NOW(), 0, 0, NULL),
  ('Prueba Retiro', '408-555-0104', 'Retiro', 'Transferencia', 'own', 'AM-0325', DATE_ADD(CURDATE(), INTERVAL 9 DAY), '13:00:00', NOW(), 0, 0, NULL),
  ('Prueba Pies', '408-555-0105', 'Uñas de los pies', 'Efectivo', '#e6d3b3', '', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '10:00:00', NOW(), 0, 0, NULL),
  ('Prueba archivo', '408-555-0106', 'Gel', 'Efectivo', '#149e78', '', DATE_ADD(CURDATE(), INTERVAL 11 DAY), '11:00:00', NOW(), 1, 0, NULL);

INSERT INTO gastos (nombre, monto, fecha) VALUES
  ('Acetona', 8, CURDATE()),
  ('Monómero', 18, DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
  ('Tips', 15, DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
  ('Limas', 6, DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
  ('Algodón', 5, DATE_ADD(CURDATE(), INTERVAL 9 DAY));
