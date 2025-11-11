const { pool } = require('../config/database');

class ReportModel {
  // Obtener registros de asistencia filtrados por fecha o búsqueda
  static async getAttendance(fecha, busqueda) {
    let sql = `
      SELECT
        r.id_registro, r.fecha, r.hora_entrada, r.hora_salida,
        u.id_usu, u.nombre_usu, u.ap_usu, u.am_usu, u.priv_usu, u.correo_usu,
        a.matricula, a.grupo,
        p.no_empleado,
        au.nombre_aula,
        au.edificio
      FROM registros r
      JOIN usuarios u ON r.id_usu = u.id_usu
      LEFT JOIN alumnos a ON u.id_usu = a.id_usu
      LEFT JOIN profesor p ON u.id_usu = p.id_usu
      JOIN aula au ON r.id_aula = au.id_aula
      WHERE 1 = 1
    `;

    const params = [];
    let paramCount = 0;

    if (fecha) {
      paramCount++;
      sql += ` AND r.fecha = $${paramCount}`;
      params.push(fecha);
    }

    if (busqueda) {
      paramCount++;
      sql += ` AND (a.matricula = $${paramCount} OR p.no_empleado = $${paramCount})`;
      params.push(busqueda);
    }

    sql += ' ORDER BY r.fecha DESC, r.hora_entrada DESC';

    const result = await pool.query(sql, params);
    return result.rows;
  }

  // Obtener reportes de asistencia por grupo y rango de fechas
  static async getAttendanceReports(fecha, grupo, fechaInicio, fechaFin) {
    let sql = `
      SELECT r.id_registro, r.fecha, r.hora_entrada, r.hora_salida,
            u.id_usu, u.nombre_usu, u.ap_usu, u.am_usu, u.priv_usu,
            a.grupo, a.matricula,
            p.no_empleado,
            au.nombre_aula, au.edificio
      FROM registros r
      JOIN usuarios u ON r.id_usu = u.id_usu
      LEFT JOIN alumnos a ON a.id_usu = u.id_usu
      LEFT JOIN profesor p ON p.id_usu = u.id_usu
      JOIN aula au ON au.id_aula = r.id_aula
      WHERE 1 = 1
    `;

    const params = [];
    let paramCount = 0;

    if (fecha) {
      paramCount++;
      sql += ` AND r.fecha = $${paramCount}`;
      params.push(fecha);
    }

    if (grupo) {
      paramCount++;
      sql += ` AND a.grupo = $${paramCount}`;
      params.push(grupo);
    }

    if (fechaInicio && fechaFin) {
      paramCount++;
      sql += ` AND r.fecha BETWEEN $${paramCount}`;
      params.push(fechaInicio);
      paramCount++;
      sql += ` AND $${paramCount}`;
      params.push(fechaFin);
    }

    const result = await pool.query(sql, params);
    return result.rows;
  }

  // Obtener todos los grupos registrados
  static async getGroups() {
    const result = await pool.query(
      `SELECT DISTINCT grupo
       FROM alumnos
       WHERE grupo IS NOT NULL AND grupo != ''
       ORDER BY grupo`
    );
    return result.rows.map(r => r.grupo);
  }
}

module.exports = ReportModel;
