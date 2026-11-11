-- Tablas del "Pase de Lista" (formato institucional EA-F-11) que el docente
-- llena desde el modulo de maestro.
--
-- No existe sistema de migraciones en este proyecto (el esquema se gestiona
-- a mano en Postgres); este archivo documenta el DDL aplicado.
--
-- Modelo:
--   pase_lista        -> una hoja por docente + asignatura + grupo + mes + anio
--   pase_lista_marca  -> una marca (A/F/R/J) por alumno y dia del mes
--
-- `grupo` es texto libre igual que en horarios.clave y alumnos.grupo (no hay
-- tablas normalizadas de materias/secciones todavia). Para que la hoja cargue
-- alumnos, `grupo` debe coincidir exactamente con los valores de alumnos.grupo.

CREATE TABLE IF NOT EXISTS pase_lista (
  id_pase            SERIAL PRIMARY KEY,
  id_docente         INTEGER      NOT NULL REFERENCES usuarios(id_usu),
  programa_educativo VARCHAR(150),
  periodo            VARCHAR(60),
  asignatura         VARCHAR(150) NOT NULL,
  grupo              VARCHAR(20)  NOT NULL,
  turno              VARCHAR(20),
  mes                SMALLINT     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio               SMALLINT     NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
  observaciones      TEXT,
  creado_en          TIMESTAMP DEFAULT now(),
  actualizado_en     TIMESTAMP DEFAULT now(),
  CONSTRAINT pase_lista_unico UNIQUE (id_docente, asignatura, grupo, mes, anio)
);

CREATE TABLE IF NOT EXISTS pase_lista_marca (
  id_marca      SERIAL   PRIMARY KEY,
  id_pase       INTEGER  NOT NULL REFERENCES pase_lista(id_pase) ON DELETE CASCADE,
  id_alumno     INTEGER  NOT NULL REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
  dia           SMALLINT NOT NULL CHECK (dia BETWEEN 1 AND 31),
  clave         CHAR(1)  NOT NULL CHECK (clave IN ('A', 'F', 'R', 'J')),
  registrado_en TIMESTAMP DEFAULT now(),
  CONSTRAINT pase_lista_marca_unica UNIQUE (id_pase, id_alumno, dia)
);

CREATE INDEX IF NOT EXISTS idx_pase_lista_docente
  ON pase_lista (id_docente, anio DESC, mes DESC);

CREATE INDEX IF NOT EXISTS idx_pase_lista_marca_pase
  ON pase_lista_marca (id_pase);

-- Claves de registro usadas por la UI y el PDF:
--   A = Asistencia, F = Falta, R = Retardo, J = Falta justificada
