INSERT INTO imports (filename, source, status, total_rows, notes)
VALUES
  (
    'leads_q1.xlsx',
    'xlsx',
    'processed',
    182,
    'Carga inicial de clientes potenciales del trimestre.'
  ),
  (
    'prospects_region_north.csv',
    'csv',
    'pending',
    64,
    'Pendiente de validacion por datos incompletos.'
  )
ON CONFLICT DO NOTHING;

INSERT INTO contacts (import_id, full_name, email, company, status)
VALUES
  (1, 'Daniela Soto', 'daniela@aurora.cl', 'Aurora Labs', 'qualified'),
  (1, 'Martin Perez', 'martin@acero.dev', 'Acero Dev', 'active'),
  (1, 'Carla Munoz', 'carla@selva.io', 'Selva.io', 'new'),
  (2, 'Rafael Torres', 'rafael@rio.com', 'Rio Digital', 'pending')
ON CONFLICT (email) DO NOTHING;
