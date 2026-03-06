-- Script para insertar productos de ejemplo en la tienda
-- Precios en Pesos Colombianos (COP)
-- Categorías: Hamburguesas, Pizzas, Pollos Fritos, Papas Fritas

-- Hamburguesas
INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES
('Hamburguesa Clásica', 'Hamburguesa clásica con lechuga, tomate y queso', 18000, 50, './images/b1.png'),
('Hamburguesa Doble Queso', 'Hamburguesa con doble queso y salsas especiales', 22000, 40, './images/b2.png'),
('Hamburguesa Bacon', 'Hamburguesa con bacon crujiente y salsa BBQ', 25000, 35, './images/b3.png'),
('Hamburguesa Picante', 'Hamburguesa con jalapeños y salsa picante', 20000, 45, './images/b4.png'),
('Hamburguesa Especial', 'Hamburguesa premium con queso cheddar y cebolla caramelizada', 28000, 30, './images/b5.png'),
('Hamburguesa Sencilla', 'Hamburguesa económica con lechuga y tomate', 15000, 60, './images/b6.png'),
('Hamburguesa Deluxe', 'Hamburguesa gourmet con huevo frito y salsa especial', 30000, 25, './images/b7.png'),
('Hamburguesa Combinada', 'Hamburguesa con queso, jamón y piña', 24000, 40, './images/b8.png');

-- Pizzas
INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES
('Pizza Margarita', 'Pizza clásica con tomate, queso y albahaca', 26000, 35, './images/p1.png'),
('Pizza Pepperoni', 'Pizza con queso y pepperoni abundante', 28000, 40, './images/p2.png'),
('Pizza Hawaiana', 'Pizza con jamón, piña y queso', 30000, 30, './images/p3.png'),
('Pizza Cuatro Quesos', 'Pizza con una mezcla especial de cuatro quesos', 32000, 25, './images/p4.png');

-- Pollo Frito
INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES
('Pollo Frito (6 piezas)', 'Pollo crujiente recién frito, 6 piezas', 35000, 30, './images/p2.png'),
('Pollo Frito (12 piezas)', 'Pollo crujiente recién frito, 12 piezas', 65000, 20, './images/p2.png'),
('Alitas Picantes', 'Alitas de pollo con salsa picante especial', 22000, 40, './images/p2.png');

-- Papas Fritas
INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES
('Papas Fritas Pequeñas', 'Papas fritas crujientes, porción pequeña', 8000, 100, './images/p3.png'),
('Papas Fritas Grandes', 'Papas fritas crujientes, porción grande', 12000, 80, './images/p3.png'),
('Papas Fritas Queso', 'Papas fritas con queso derretido', 15000, 60, './images/p3.png'),
('Papas Fritas BBQ', 'Papas fritas con sabor a BBQ', 14000, 70, './images/p3.png');
