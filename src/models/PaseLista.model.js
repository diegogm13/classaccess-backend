// models/PaseLista.model.js
// Hojas de "Pase de Lista" (formato institucional EA-F-11) y sus marcas.
// DDL en docs/schema-pase-lista.sql
const { pool } = require('../config/database');

const CLAVES_VALIDAS = ['A', 'F', 'R', 'J'];

class PaseListaModel {
  /**
   * Grupos disponibles para armar una hoja.
   * Se toman de alumnos.grupo (lo que realmente tiene alumnos) y se enriquecen
   * con horarios.clave cuando coincide.
   */
  static async getGrupos() {
    const query = `
      SELECT
        a.grupo,
        COUNT(*)::int AS total_alumnos,
        MAX(h.nombre)   AS nombre,
        MAX(h.turno)    AS turno,
        MAX(h.docente)  AS docente,
        MAX(h.aula)     AS aula,
        MAX(h.edificio) AS edificio
      FROM alumnos a
      LEFT JOIN horarios h ON h.clave = a.grupo
      WHERE a.grupo IS NOT NULL AND a.grupo <> ''
      GROUP BY a.grupo
      ORDER BY a.grupo
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Alumnos inscritos en un grupo, en el orden en que aparecen en la hoja.
   */
  static async getAlumnosPorGrupo(grupo) {
    const query = `
      SELECT
        a.id_alumno,
        a.matricula,
        a.grupo,
        u.id_usu,
        u.nombre_usu,
        u.ap_usu,
        u.am_usu
      FROM alumnos a
      JOIN usuarios u ON u.id_usu = a.id_usu
      WHERE a.grupo = $1
      ORDER BY u.ap_usu, u.am_usu, u.nombre_usu
    `;
    const result = await pool.query(query, [grupo]);
    return result.rows;
  }

  /**
   * Buscar la hoja de un docente por asignatura + grupo + mes + anio.
   */
  static async findHoja(idDocente, asignatura, grupo, mes, anio) {
    const query = `
      SELECT * FROM pase_lista
      WHERE id_docente = $1 AND asignatura = $2 AND grupo = $3 AND mes = $4 AND anio = $5
    `;
    const result = await pool.query(query, [idDocente, asignatura, grupo, mes, anio]);
    return result.rows[0] || null;
  }

  static async findHojaById(idPase) {
    const result = await pool.query('SELECT * FROM pase_lista WHERE id_pase = $1', [idPase]);
    return result.rows[0] || null;
  }

  /**
   * Hojas de un docente, mas recientes primero.
   */
  static async listarHojas(idDocente) {
    const query = `
      SELECT
        p.*,
        (SELECT COUNT(*)::int FROM pase_lista_marca m WHERE m.id_pase = p.id_pase) AS total_marcas,
        (SELECT COUNT(*)::int FROM alumnos a WHERE a.grupo = p.grupo) AS total_alumnos
      FROM pase_lista p
      WHERE p.id_docente = $1
      ORDER BY p.anio DESC, p.mes DESC, p.actualizado_en DESC
    `;
    const result = await pool.query(query, [idDocente]);
    return result.rows;
  }

  /**
   * Crear o actualizar el encabezado de la hoja.
   * La clave natural es (id_docente, asignatura, grupo, mes, anio).
   */
  static async upsertHoja({
    id_docente,
    programa_educativo,
    periodo,
    asignatura,
    grupo,
    turno,
    mes,
    anio,
    observaciones,
  }) {
    const query = `
      INSERT INTO pase_lista
        (id_docente, programa_educativo, periodo, asignatura, grupo, turno, mes, anio, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT ON CONSTRAINT pase_lista_unico
      DO UPDATE SET
        programa_educativo = EXCLUDED.programa_educativo,
        periodo            = EXCLUDED.periodo,
        turno              = EXCLUDED.turno,
        observaciones      = EXCLUDED.observaciones,
        actualizado_en     = now()
      RETURNING *
    `;
    const result = await pool.query(query, [
      id_docente,
      programa_educativo || null,
      periodo || null,
      asignatura,
      grupo,
      turno || null,
      mes,
      anio,
      observaciones || null,
    ]);
    return result.rows[0];
  }

  /**
   * Marcas de una hoja.
   */
  static async getMarcas(idPase) {
    const query = `
      SELECT id_alumno, dia, clave
      FROM pase_lista_marca
      WHERE id_pase = $1
      ORDER BY id_alumno, dia
    `;
    const result = await pool.query(query, [idPase]);
    return result.rows;
  }

  /**
   * Reemplaza el conjunto de marcas de la hoja por el recibido.
   * Las celdas que el docente vacio desaparecen; las que no cambiaron
   * conservan su registrado_en original.
   */
  static async guardarMarcas(idPase, marcas) {
    const idsAlumno = marcas.map((m) => m.id_alumno);
    const dias = marcas.map((m) => m.dia);
    const claves = marcas.map((m) => m.clave);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Borrar las marcas que ya no vienen en el payload
      await client.query(
        `DELETE FROM pase_lista_marca m
          WHERE m.id_pase = $1
            AND NOT EXISTS (
              SELECT 1 FROM unnest($2::int[], $3::int[]) AS t(id_alumno, dia)
               WHERE t.id_alumno = m.id_alumno AND t.dia = m.dia
            )`,
        [idPase, idsAlumno, dias]
      );

      // 2. Insertar/actualizar las marcas recibidas
      if (marcas.length > 0) {
        await client.query(
          `INSERT INTO pase_lista_marca (id_pase, id_alumno, dia, clave)
           SELECT $1, t.id_alumno, t.dia, t.clave
             FROM unnest($2::int[], $3::int[], $4::text[]) AS t(id_alumno, dia, clave)
           ON CONFLICT ON CONSTRAINT pase_lista_marca_unica
           DO UPDATE SET clave = EXCLUDED.clave, registrado_en = now()`,
          [idPase, idsAlumno, dias, claves]
        );
      }

      await client.query(
        'UPDATE pase_lista SET actualizado_en = now() WHERE id_pase = $1',
        [idPase]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.getMarcas(idPase);
  }

  static async actualizarObservaciones(idPase, observaciones) {
    const result = await pool.query(
      `UPDATE pase_lista
          SET observaciones = $2, actualizado_en = now()
        WHERE id_pase = $1
      RETURNING *`,
      [idPase, observaciones || null]
    );
    return result.rows[0] || null;
  }

  static async eliminarHoja(idPase) {
    const result = await pool.query(
      'DELETE FROM pase_lista WHERE id_pase = $1 RETURNING id_pase',
      [idPase]
    );
    return result.rowCount > 0;
  }
}

module.exports = PaseListaModel;
module.exports.CLAVES_VALIDAS = CLAVES_VALIDAS;
