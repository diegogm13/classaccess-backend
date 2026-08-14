-- Tabla de horarios/grupos para la vista "Control de Horarios".
-- No existe sistema de migraciones en este proyecto (el esquema se gestiona
-- a mano en Postgres); este archivo documenta el DDL aplicado.
--
-- docente/edificio/aula quedan como texto libre (igual que alumnos.grupo,
-- sin FK) porque no hay tablas normalizadas de materias/secciones todavía.
--
-- Para que "Reportes de Asistencia" calcule cumplimiento/retardos/faltas de
-- un grupo, la columna `clave` debe coincidir exactamente con los valores
-- reales de `alumnos.grupo` (ej. "3A"), no con nombres inventados.

CREATE TABLE IF NOT EXISTS horarios (
  id_horario SERIAL PRIMARY KEY,
  clave VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  turno VARCHAR(20) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  dias_laborales TEXT[] NOT NULL,
  edificio VARCHAR(100),
  aula VARCHAR(100),
  docente VARCHAR(150),
  alumnos_inscritos INTEGER DEFAULT 0,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);
