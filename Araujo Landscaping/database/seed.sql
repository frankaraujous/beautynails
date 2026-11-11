SET NAMES utf8mb4;
SET time_zone = '-07:00';

INSERT INTO ajustes (clave, valor) VALUES
  ('admin_password_hash', '$2y$10$4O6n9OPrJsV08X2US7M3zO6437A.paZIRJRvb67VHdExAtFVbnmxm'),
  ('meta_mensual', '10000'),
  ('seq_est', '2003'),
  ('seq_inv', '2001'),
  ('depot_label', 'Salida · centro de San José'),
  ('depot_lat', '37.3382'),
  ('depot_lng', '-121.8863');

INSERT INTO clientes (id, nombre, telefono, correo, direccion, lat, lng, servicio, precio, frecuencia, dia_servicio, paridad, notas, activo) VALUES
  (1, 'Ana Lucía Ruiz Morales', '408-555-1001', 'ana.morales@correo.com', '1427 Willow St, Willow Glen, San José, CA 95125', 37.3085, -121.8998, 'Corte de césped', 65, 'semanal', 1, 0, 'Perro en el patio. Entrar por el portón lateral.', 1),
  (2, 'Luis Alberto Ortega Vega', '408-555-1002', 'luis.ortega@correo.com', '875 Chapman St, Rose Garden, San José, CA 95126', 37.3388, -121.9334, 'Corte de césped', 70, 'semanal', 2, 1, 'Dejar el recorte en la banqueta. No usar sopladora antes de las 9.', 1),
  (3, 'Carmen Elena Díaz Ríos', '408-555-1003', 'carmen.diaz@correo.com', '6200 Meridian Ave, Almaden, San José, CA 95120', 37.2274, -121.8622, 'Mantenimiento', 120, 'quincenal', 3, 0, 'Código del portón 2580. Incluye bordes y arbustos del frente.', 1),
  (4, 'Pedro Antonio Sánchez Gil', '408-555-1004', 'pedro.sanchez@correo.com', '3180 Quimby Rd, Evergreen, San José, CA 95148', 37.3142, -121.7735, 'Corte de césped', 60, 'semanal', 4, 1, 'Pasto alto junto a la cerca del fondo.', 1),
  (5, 'Rosa María Méndez Castro', '408-555-1005', 'rosa.mendez@correo.com', '1620 Berryessa Rd, Berryessa, San José, CA 95133', 37.3834, -121.8582, 'Corte de césped', 68, 'semanal', 5, 0, 'Timbre no funciona. Llamar al llegar.', 1),
  (6, 'Jorge Andrés Castillo León', '408-555-1006', 'jorge.castillo@correo.com', '4555 Camden Ave, Cambrian, San José, CA 95124', 37.2571, -121.9294, 'Mantenimiento', 110, 'quincenal', 1, 1, 'Hay un sistema de riego. Cuidado con los aspersores.', 1),
  (7, 'Elena Sofía Vargas Núñez', '408-555-1007', 'elena.vargas@correo.com', '5950 Santa Teresa Blvd, Santa Teresa, San José, CA 95123', 37.2286, -121.7884, 'Corte de césped', 62, 'semanal', 2, 0, 'Entrada por el callejón. El carro va atrás.', 1),
  (8, 'Marco Antonio León Paredes', '408-555-1008', 'marco.leon@correo.com', '2300 Alum Rock Ave, Alum Rock, San José, CA 95116', 37.3672, -121.8261, 'Corte de césped', 58, 'semanal', 3, 1, 'Lote chico. Una persona alcanza.', 1),
  (9, 'Sofía Isabel Navarro Cruz', '408-555-1009', 'sofia.navarro@correo.com', '575 N 6th St, Japantown, San José, CA 95112', 37.3484, -121.8946, 'Corte de césped', 75, 'semanal', 4, 0, 'Patio interior. Llevar la bolsa de recorte a la calle.', 1),
  (10, 'Andrés Felipe Paredes Mora', '408-555-1010', 'andres.paredes@correo.com', '280 E William St, Naglee Park, San José, CA 95112', 37.3361, -121.8684, 'Mantenimiento', 130, 'quincenal', 5, 1, 'Setos del frente y césped. Factura por Zelle.', 1),
  (11, 'Lucía Fernanda Herrera Solís', '408-555-1011', 'lucia.herrera@correo.com', '455 Blossom Hill Rd, Blossom Hill, San José, CA 95123', 37.2524, -121.8628, 'Corte de césped', 64, 'semanal', 1, 0, 'Niños en casa después de las 3. Terminar temprano.', 1),
  (12, 'Diego Armando Ramos Peña', '408-555-1012', 'diego.ramos@correo.com', '4750 Silver Creek Rd, Silver Creek, San José, CA 95121', 37.3056, -121.7902, 'Corte de césped', 66, 'semanal', 2, 1, 'Dos patios, frente y atrás.', 1),
  (13, 'Patricia Alejandra Gómez Reyes', '408-555-1013', 'patricia.gomez@correo.com', '3950 Williams Rd, West San José, CA 95117', 37.3052, -121.9804, 'Mantenimiento', 140, 'quincenal', 3, 0, 'Incluye limpieza de hojas del estacionamiento.', 1),
  (14, 'Héctor Manuel Molina Aguilar', '408-555-1014', 'hector.molina@correo.com', '1500 N 1st St, North San José, CA 95112', 37.4008, -121.9206, 'Corte de césped', 72, 'semanal', 4, 1, 'Estacionar en la calle, no en la entrada.', 1),
  (15, 'Valeria Guadalupe Cruz Santos', '408-555-1015', 'valeria.cruz@correo.com', '3200 Communications Hill Blvd, San José, CA 95136', 37.2874, -121.8482, 'Corte de césped', 69, 'semanal', 5, 0, 'Pendiente pronunciada. Usar zapatos con buen agarre.', 1),
  (16, 'Ricardo Emilio Flores Duarte', '408-555-1016', 'ricardo.flores@correo.com', '4700 Monterey Rd, Seven Trees, San José, CA 95111', 37.2782, -121.8265, 'Corte de césped', 55, 'semanal', 1, 1, 'Solo el frente. El fondo lo corta él.', 1),
  (17, 'Isabel Carmen Torres Mendoza', '408-555-1017', 'isabel.torres@correo.com', '2150 Story Rd, East San José, CA 95122', 37.3551, -121.8304, 'Mantenimiento', 100, 'mensual', 2, 0, 'Visita mensual: césped, bordes y basura verde.', 1),
  (18, 'Oscar Iván Blanco Herrera', '408-555-1018', 'oscar.blanco@correo.com', '200 E Campbell Ave, Campbell, CA 95008', 37.2876, -121.9502, 'Corte de césped', 74, 'semanal', 3, 1, 'Casa esquina. Incluye la franja de la calle lateral.', 1),
  (19, 'Natalia Beatriz Reyes Campos', '408-555-1019', 'natalia.reyes@correo.com', '5850 Monterey Rd, Edenvale, San José, CA 95138', 37.2684, -121.8186, 'Corte de césped', 61, 'semanal', 4, 0, 'Llave bajo la maceta azul si no hay nadie.', 1),
  (20, 'Fernando José Aguilar Rivas', '408-555-1020', 'fernando.aguilar@correo.com', '1000 Gold St, Alviso, San José, CA 95002', 37.4282, -121.9751, 'Mantenimiento', 150, 'mensual', 5, 1, 'Lote grande. Llevar la podadora de empuje y la de hilo.', 1),
  (21, 'Beatriz Elena Campos Ruiz', '408-555-1101', 'beatriz.campos@correo.com', '900 Minnesota Ave, Willow Glen, San José, CA 95125', 37.3121, -121.9014, 'Corte de césped', 60, 'semanal', 1, 0, 'Pausó el servicio en septiembre.', 0),
  (22, 'Gabriel Tomás Herrera Díaz', '408-555-1102', 'gabriel.herrera@correo.com', '1500 The Alameda, San José, CA 95126', 37.3332, -121.9102, 'Mantenimiento', 95, 'quincenal', 2, 0, 'Se mudó. Confirmar antes de volver a la ruta.', 0),
  (23, 'Marta Lucía Peña Ortiz', '408-555-1103', 'marta.pena@correo.com', '2200 Alum Rock Ave, San José, CA 95116', 37.3654, -121.8298, 'Corte de césped', 58, 'semanal', 3, 0, 'Pidió pausa por el invierno.', 0),
  (24, 'Raúl Ignacio Soto Vargas', '408-555-1104', 'raul.soto@correo.com', '800 Blossom Hill Rd, San José, CA 95123', 37.2498, -121.8596, 'Corte de césped', 70, 'semanal', 4, 0, 'Canceló hasta nuevo aviso.', 0),
  (25, 'Teresa Noemí Aguilar León', '408-555-1105', 'teresa.aguilar@correo.com', '400 E Santa Clara St, San José, CA 95113', 37.3389, -121.8798, 'Mantenimiento', 110, 'mensual', 5, 0, 'Casa en venta. No visitar.', 0);

INSERT INTO cuadrillas (id, nombre, notas) VALUES
  (1, 'Cuadrilla 1', 'Ruta de mantenimiento de San José.'),
  (2, 'Cuadrilla 2', 'Ruta norte de San José.'),
  (3, 'Cuadrilla 3', 'Ruta sur de San José.'),
  (4, 'Cuadrilla 4', 'Ruta este de San José.');

INSERT INTO empleados (id, nombre, telefono, correo, direccion, puesto, notas, pago_hora, codigo) VALUES
  (1, 'Miguel Ángel Araujo Herrera', '408-555-2001', 'miguel.araujo@araujoslandscaping.com', '840 The Alameda, San José, CA 95126', 'Capataz', 'Licencia de manejar vigente. Habla español e inglés. Lleva la ruta.', 32, '2101'),
  (2, 'José Luis Ramírez Soto', '408-555-2002', 'jose.ramirez@araujoslandscaping.com', '1260 N 4th St, San José, CA 95112', 'Jardinero', 'Cortes y bordes. Tres años en la empresa.', 24, '2102'),
  (3, 'Carlos Eduardo Mendoza Cruz', '408-555-2003', 'carlos.mendoza@araujoslandscaping.com', '90 S Jackson Ave, San José, CA 95116', 'Jardinero', 'Mantenimiento de arbustos y riego.', 22, '2103'),
  (4, 'Daniel Omar Ortiz Vega', '408-555-2004', 'daniel.ortiz@araujoslandscaping.com', '2100 Senter Rd, San José, CA 95112', 'Ayudante', 'Sopladora, carga y limpieza. Entra a las 7:30.', 18, '2104'),
  (5, 'Mateo Ignacio Rojas Peña', '408-555-2011', 'mateo.rojas@araujoslandscaping.com', '410 N Capitol Ave, San José, CA 95133', 'Capataz', 'Lleva la ruta norte. Habla español e inglés.', 30, '2301'),
  (6, 'Camila Fernanda López Díaz', '408-555-2012', 'camila.lopez@araujoslandscaping.com', '1201 McKay Dr, San José, CA 95131', 'Jardinero', 'Cortes y bordes en Berryessa.', 23, '2302'),
  (7, 'Samuel Andrés Vega Ruiz', '408-555-2013', 'samuel.vega@araujoslandscaping.com', '2500 Berryessa Rd, San José, CA 95132', 'Ayudante', 'Sopladora y carga.', 17, '2303'),
  (8, 'Elena Patricia Morales Gil', '408-555-2014', 'elena.morales@araujoslandscaping.com', '5000 Almaden Expy, San José, CA 95118', 'Capataz', 'Lleva la ruta sur.', 29, '2304'),
  (9, 'Bruno Alejandro Castro Núñez', '408-555-2015', 'bruno.castro@araujoslandscaping.com', '600 Blossom Hill Rd, San José, CA 95123', 'Jardinero', 'Arbustos y riego.', 22, '2305'),
  (10, 'Lucía Marina Ortega Solís', '408-555-2016', 'lucia.ortega@araujoslandscaping.com', '2000 Camden Ave, San José, CA 95124', 'Ayudante', 'Entra a las 7:30.', 17, '2306'),
  (11, 'Rodrigo Emiliano Fuentes Lara', '408-555-2017', 'rodrigo.fuentes@araujoslandscaping.com', '2800 Quimby Rd, San José, CA 95148', 'Capataz', 'Lleva la ruta de Evergreen.', 31, '2307'),
  (12, 'Natalia Isabel Romero Paz', '408-555-2018', 'natalia.romero@araujoslandscaping.com', '3500 Yerba Buena Rd, San José, CA 95121', 'Jardinero', 'Cortes de lotes grandes.', 23, '2308'),
  (13, 'Pablo Sebastián Méndez Ríos', '408-555-2019', 'pablo.mendez@araujoslandscaping.com', '1000 Story Rd, San José, CA 95122', 'Ayudante', 'Carga y limpieza.', 16, '2309');

INSERT INTO empleado_cuadrillas (empleado_id, cuadrilla_id, orden) VALUES
  (1, 1, 1), (2, 1, 1), (3, 1, 1), (4, 1, 1),
  (5, 2, 1), (6, 2, 1), (7, 2, 1),
  (8, 3, 1), (9, 3, 1), (10, 3, 1),
  (11, 4, 1), (12, 4, 1), (13, 4, 1);

INSERT INTO estimados (id, numero, cliente_id, nombre, telefono, direccion, nota, firmo_nombre, firmado_en, creado, estado) VALUES
  (1, 'EST-1001', 1, 'Ana Lucía Ruiz Morales', '408-555-1001', '1427 Willow St, Willow Glen, San José, CA 95125', 'Incluye el patio de atrás.', 'Ana Lucía Ruiz Morales', '2026-10-01', '2026-09-30', 'firmado'),
  (2, 'EST-1002', 2, 'Luis Alberto Ortega Vega', '408-555-1002', '875 Chapman St, Rose Garden, San José, CA 95126', 'Esperando la firma del cliente.', '', NULL, '2026-10-02', 'enviado'),
  (3, 'EST-1003', 3, 'Carmen Elena Díaz Ríos', '408-555-1003', '6200 Meridian Ave, Almaden, San José, CA 95120', 'Aprobado y cobrado por Zelle.', 'Carmen Elena Díaz Ríos', '2026-09-28', '2026-09-26', 'facturado'),
  (4, 'EST-1004', 6, 'Jorge Andrés Castillo León', '408-555-1006', '4555 Camden Ave, Cambrian, San José, CA 95124', 'Trabajo terminado. Invoice por cobrar.', 'Jorge Andrés Castillo León', '2026-09-29', '2026-09-27', 'facturado'),
  (5, 'EST-2001', 5, 'Rosa María Méndez Castro', '408-555-1005', '1620 Berryessa Rd, Berryessa, San José, CA 95133', 'Prueba: listo para firmar.', '', NULL, '2026-10-02', 'enviado'),
  (6, 'EST-2002', 10, 'Andrés Felipe Paredes Mora', '408-555-1010', '280 E William St, Naglee Park, San José, CA 95112', 'Prueba: ya firmado.', 'Andrés Felipe Paredes Mora', '2026-10-02', '2026-10-02', 'firmado'),
  (7, 'EST-2003', 15, 'Valeria Guadalupe Cruz Santos', '408-555-1015', '3200 Communications Hill Blvd, San José, CA 95136', 'Prueba: ya tiene invoice.', 'Valeria Guadalupe Cruz Santos', '2026-10-02', '2026-10-02', 'facturado');

INSERT INTO estimado_partidas (estimado_id, descripcion, cantidad, precio, orden) VALUES
  (1, 'Corte de césped', 1, 65, 1), (1, 'Fertilizante', 1, 25, 2),
  (2, 'Corte de césped', 1, 70, 1), (2, 'Bordes', 1, 20, 2),
  (3, 'Mantenimiento', 1, 120, 1), (3, 'Poda de arbustos', 1, 80, 2),
  (4, 'Mantenimiento', 1, 110, 1), (4, 'Recolección de hojas', 1, 35, 2),
  (5, 'Corte de césped', 1, 68, 1), (5, 'Bordes', 1, 25, 2),
  (6, 'Mantenimiento', 1, 130, 1), (6, 'Setos del frente', 1, 40, 2),
  (7, 'Corte de césped', 1, 69, 1), (7, 'Limpieza de pendiente', 1, 35, 2);

INSERT INTO invoices (id, numero, estado, emitido, pagado_en, pago, nombre, telefono, direccion, subtotal, impuesto, total, origen, estimado_id, cliente_id) VALUES
  (1, 'INV-1001', 'pagado', '2026-10-01', '2026-10-01', 'Zelle', 'Carmen Elena Díaz Ríos', '408-555-1003', '6200 Meridian Ave, Almaden, San José, CA 95120', 200, 0, 200, 'estimado', 3, 3),
  (2, 'INV-1002', 'por-cobrar', '2026-10-02', NULL, '', 'Jorge Andrés Castillo León', '408-555-1006', '4555 Camden Ave, Cambrian, San José, CA 95124', 145, 0, 145, 'estimado', 4, 6),
  (3, 'INV-2001', 'por-cobrar', '2026-10-02', NULL, '', 'Valeria Guadalupe Cruz Santos', '408-555-1015', '3200 Communications Hill Blvd, San José, CA 95136', 104, 0, 104, 'estimado', 7, 15);

INSERT INTO invoice_partidas (invoice_id, descripcion, cantidad, precio, orden) VALUES
  (1, 'Mantenimiento', 1, 120, 1), (1, 'Poda de arbustos', 1, 80, 2),
  (2, 'Mantenimiento', 1, 110, 1), (2, 'Recolección de hojas', 1, 35, 2),
  (3, 'Corte de césped', 1, 69, 1), (3, 'Limpieza de pendiente', 1, 35, 2);

INSERT INTO invoice_costos (invoice_id, materiales, mano_obra, basurero, otros) VALUES
  (1, 40, 55, 15, 10),
  (2, 20, 40, 10, 0),
  (3, 12, 30, 8, 0);

SET @mon = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY);
INSERT INTO fichajes (empleado_id, entrada, salida, lat_entrada, lng_entrada, lat_salida, lng_salida) VALUES
  (1, TIMESTAMP(@mon, '07:00:00'), TIMESTAMP(@mon, '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (1, TIMESTAMP(DATE_ADD(@mon, INTERVAL 1 DAY), '07:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 1 DAY), '15:30:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (1, TIMESTAMP(DATE_ADD(@mon, INTERVAL 2 DAY), '07:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 2 DAY), '15:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (1, TIMESTAMP(DATE_ADD(@mon, INTERVAL 3 DAY), '07:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 3 DAY), '17:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (1, TIMESTAMP(DATE_ADD(@mon, INTERVAL 4 DAY), '07:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 4 DAY), '15:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (2, TIMESTAMP(@mon, '07:30:00'), TIMESTAMP(@mon, '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (2, TIMESTAMP(DATE_ADD(@mon, INTERVAL 1 DAY), '07:30:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 1 DAY), '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (2, TIMESTAMP(DATE_ADD(@mon, INTERVAL 2 DAY), '07:30:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 2 DAY), '15:30:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (2, TIMESTAMP(DATE_ADD(@mon, INTERVAL 3 DAY), '07:30:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 3 DAY), '16:30:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (2, TIMESTAMP(DATE_ADD(@mon, INTERVAL 4 DAY), '07:30:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 4 DAY), '15:30:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (2, TIMESTAMP(DATE_ADD(@mon, INTERVAL 5 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 5 DAY), '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (3, TIMESTAMP(@mon, '08:00:00'), TIMESTAMP(@mon, '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (3, TIMESTAMP(DATE_ADD(@mon, INTERVAL 1 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 1 DAY), '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (3, TIMESTAMP(DATE_ADD(@mon, INTERVAL 2 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 2 DAY), '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (3, TIMESTAMP(DATE_ADD(@mon, INTERVAL 3 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 3 DAY), '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (4, TIMESTAMP(@mon, '08:00:00'), TIMESTAMP(@mon, '14:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (4, TIMESTAMP(DATE_ADD(@mon, INTERVAL 1 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 1 DAY), '16:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (4, TIMESTAMP(DATE_ADD(@mon, INTERVAL 2 DAY), '07:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 2 DAY), '19:30:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (4, TIMESTAMP(DATE_ADD(@mon, INTERVAL 3 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 3 DAY), '15:00:00'), 37.3382, -121.8863, 37.3382, -121.8863),
  (4, TIMESTAMP(DATE_ADD(@mon, INTERVAL 4 DAY), '08:00:00'), TIMESTAMP(DATE_ADD(@mon, INTERVAL 4 DAY), '13:00:00'), 37.3382, -121.8863, 37.3382, -121.8863);

INSERT INTO gastos (fecha, categoria, descripcion, monto) VALUES
  (DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Combustible', 'Gasolina de la semana', 86),
  (DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Basurero', 'Entrega de verde', 40);
