const { pool } = require('../config/database');

/**
 * Consultas de analítica de asistencia para la vista "Reportes de Asistencia".
 *
 * Metodología: un alumno tiene un horario esperado si `horarios.clave` coincide
 * exactamente con `alumnos.grupo`. Sin esa coincidencia, el alumno queda fuera
 * de los cálculos de cumplimiento/retardos/faltas (no hay con qué comparar su
 * hora de entrada esperada). "Falta" = día laboral esperado (según
 * `horarios.dias_laborales`) sin ningún registro de entrada ese día.
 */
class ReportesAsistenciaModel {
  static async contarAlumnosActivos(desde, hasta) {
    const result = await pool.query(
      `SELECT COUNT(DISTINCT r.id_usu)::int AS total
       FROM registros r
       JOIN alumnos a ON a.id_usu = r.id_usu
       WHERE r.fecha BETWEEN $1 AND $2`,
      [desde, hasta]
    );
    return result.rows[0].total;
  }

  static async contarATiempoYRetardos(desde, hasta) {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE r.hora_entrada <= h.hora_inicio)::int AS a_tiempo,
         COUNT(*) FILTER (WHERE r.hora_entrada > h.hora_inicio)::int AS retardo
       FROM registros r
       JOIN alumnos a ON a.id_usu = r.id_usu
       JOIN horarios h ON h.clave = a.grupo
       WHERE r.fecha BETWEEN $1 AND $2 AND r.hora_entrada IS NOT NULL`,
      [desde, hasta]
    );
    return result.rows[0];
  }

  static async contarFaltas(desde, hasta) {
    const result = await pool.query(
      `WITH dias_periodo AS (
         SELECT generate_series($1::date, $2::date, interval '1 day')::date AS dia
       ),
       dia_semana AS (
         SELECT dia, (ARRAY['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'])[EXTRACT(DOW FROM dia)::int + 1] AS nombre_dia
         FROM dias_periodo
       ),
       esperado AS (
         SELECT a.id_usu, ds.dia
         FROM alumnos a
         JOIN horarios h ON h.clave = a.grupo
         JOIN dia_semana ds ON ds.nombre_dia = ANY(h.dias_laborales)
       )
       SELECT COUNT(*)::int AS total
       FROM esperado e
       LEFT JOIN registros r ON r.id_usu = e.id_usu AND r.fecha = e.dia
       WHERE r.id_registro IS NULL`,
      [desde, hasta]
    );
    return result.rows[0].total;
  }

  static async getTendenciaDiaria(desde, hasta) {
    const asistencias = await pool.query(
      `SELECT
         r.fecha,
         COUNT(*) FILTER (WHERE r.hora_entrada <= h.hora_inicio)::int AS a_tiempo,
         COUNT(*) FILTER (WHERE r.hora_entrada > h.hora_inicio)::int AS retardo
       FROM registros r
       JOIN alumnos a ON a.id_usu = r.id_usu
       JOIN horarios h ON h.clave = a.grupo
       WHERE r.fecha BETWEEN $1 AND $2 AND r.hora_entrada IS NOT NULL
       GROUP BY r.fecha
       ORDER BY r.fecha`,
      [desde, hasta]
    );

    const porDia = new Map();
    for (const fila of asistencias.rows) {
      const clave = fila.fecha.toISOString().slice(0, 10);
      porDia.set(clave, { fecha: clave, a_tiempo: fila.a_tiempo, retardo: fila.retardo });
    }
    return porDia;
  }

  static async getTablaAlumnos(desde, hasta) {
    const base = await pool.query(
      `SELECT
         u.id_usu,
         u.nombre_usu,
         u.ap_usu,
         u.am_usu,
         a.matricula,
         a.grupo,
         COUNT(r.id_registro) FILTER (WHERE r.hora_entrada <= h.hora_inicio)::int AS a_tiempo,
         COUNT(r.id_registro) FILTER (WHERE r.hora_entrada > h.hora_inicio)::int AS retardos,
         COUNT(DISTINCT r.fecha)::int AS dias_asistidos
       FROM alumnos a
       JOIN usuarios u ON u.id_usu = a.id_usu
       LEFT JOIN horarios h ON h.clave = a.grupo
       LEFT JOIN registros r
         ON r.id_usu = a.id_usu AND r.fecha BETWEEN $1 AND $2 AND r.hora_entrada IS NOT NULL
       GROUP BY u.id_usu, u.nombre_usu, u.ap_usu, u.am_usu, a.matricula, a.grupo
       ORDER BY u.ap_usu, u.am_usu, u.nombre_usu`,
      [desde, hasta]
    );

    const diasEsperados = await pool.query(
      `WITH dias_periodo AS (
         SELECT generate_series($1::date, $2::date, interval '1 day')::date AS dia
       ),
       dia_semana AS (
         SELECT dia, (ARRAY['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'])[EXTRACT(DOW FROM dia)::int + 1] AS nombre_dia
         FROM dias_periodo
       )
       SELECT a.id_usu, COUNT(*)::int AS dias_esperados
       FROM alumnos a
       JOIN horarios h ON h.clave = a.grupo
       JOIN dia_semana ds ON ds.nombre_dia = ANY(h.dias_laborales)
       GROUP BY a.id_usu`,
      [desde, hasta]
    );

    const esperadosPorAlumno = new Map(
      diasEsperados.rows.map((fila) => [fila.id_usu, fila.dias_esperados])
    );

    return base.rows.map((fila) => {
      const esperados = esperadosPorAlumno.get(fila.id_usu) ?? null;
      const faltas = esperados === null ? null : Math.max(0, esperados - fila.dias_asistidos);
      const totalConHorario = fila.a_tiempo + fila.retardos;
      const cumplimiento_pct =
        totalConHorario === 0 ? null : Math.round((fila.a_tiempo / totalConHorario) * 1000) / 10;

      return {
        id_usu: fila.id_usu,
        nombre: `${fila.nombre_usu} ${fila.ap_usu} ${fila.am_usu}`,
        matricula: fila.matricula,
        grupo: fila.grupo,
        a_tiempo: fila.a_tiempo,
        retardos: fila.retardos,
        faltas,
        cumplimiento_pct,
      };
    });
  }
}

module.exports = ReportesAsistenciaModel;
