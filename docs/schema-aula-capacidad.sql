-- Agrega la capacidad (número de alumnos) a las aulas, para la vista
-- "Estado de Salones" de Reportes de Asistencia. Nullable — las aulas
-- existentes no tienen valor hasta que se edite manualmente en la BD
-- (no hay UI todavía en el CRUD de Aulas de React para este campo).

ALTER TABLE aula ADD COLUMN IF NOT EXISTS capacidad INTEGER;
