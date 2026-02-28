-- Import SQL prêt à exécuter pour alimenter une base relationnelle
-- Source: ticket SHILO H INTERNATIONAL n°1599588 (2026-02-14 18:36)

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id INT PRIMARY KEY,
  store_name VARCHAR(120),
  address_line VARCHAR(120),
  postal_code VARCHAR(10),
  city VARCHAR(80),
  phone VARCHAR(30),
  siret VARCHAR(20),
  receipt_date DATE,
  receipt_time TIME,
  ticket_number VARCHAR(30),
  register_number VARCHAR(10),
  cashier VARCHAR(80),
  currency CHAR(3),
  items_count INT,
  total_to_pay DECIMAL(10,2),
  payment_method VARCHAR(20),
  payment_amount DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS receipt_items (
  item_id INT PRIMARY KEY,
  receipt_id INT NOT NULL,
  line_no INT,
  description VARCHAR(200),
  quantity DECIMAL(10,3),
  unit VARCHAR(20),
  unit_price DECIMAL(10,3),
  line_total DECIMAL(10,2),
  FOREIGN KEY (receipt_id) REFERENCES receipts(receipt_id)
);

CREATE TABLE IF NOT EXISTS receipt_taxes (
  tax_id INT PRIMARY KEY,
  receipt_id INT NOT NULL,
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(10,2),
  amount_ht DECIMAL(10,2),
  amount_ttc DECIMAL(10,2),
  FOREIGN KEY (receipt_id) REFERENCES receipts(receipt_id)
);

INSERT INTO receipts (
  receipt_id, store_name, address_line, postal_code, city, phone, siret,
  receipt_date, receipt_time, ticket_number, register_number, cashier,
  currency, items_count, total_to_pay, payment_method, payment_amount
) VALUES (
  1, 'SHILO H INTERNATIONAL', '65 RUE BRION', '97111', 'MORNE A L''EAU',
  '0590 47 58 61', '82019082500027',
  '2026-02-14', '18:36:00', '1599588', '02', 'ANISSA (12)',
  'EUR', 7, 16.90, 'CB', 16.90
);

INSERT INTO receipt_items (
  item_id, receipt_id, line_no, description, quantity, unit, unit_price, line_total
) VALUES
  (1, 1, 1, 'NETTO SIROP MENTHE BLLE 1L', 1, 'unit', 3.75, 3.75),
  (2, 1, 2, 'VINAIGRE ALCOOL BLANC 8% 1L SOCARIZ', 1, 'unit', 1.35, 1.35),
  (3, 1, 3, 'COCA COLA BTLLE 2L', 1, 'unit', 3.49, 3.49),
  (4, 1, 4, 'SUPPLEMENT FRAIS', 1, 'unit', 0.30, 0.30),
  (5, 1, 5, 'CITRON VERT LE KG', 0.195, 'kg', 3.20, 0.62),
  (6, 1, 6, 'LE LYNX 480G TAB LAVE VAISSELLE', 1, 'unit', 2.40, 2.40),
  (7, 1, 7, 'CHIPS LAY''S 250G', 1, 'unit', 4.99, 4.99);

INSERT INTO receipt_taxes (
  tax_id, receipt_id, tax_rate, tax_amount, amount_ht, amount_ttc
) VALUES
  (1, 1, 0.00, 0.00, 6.64, 6.64),
  (2, 1, 2.10, 0.16, 7.70, 7.86),
  (3, 1, 8.50, 0.19, 2.21, 2.40);
