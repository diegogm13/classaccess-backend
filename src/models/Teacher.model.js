const { pool } = require('../config/database');

class TeacherModel {
  static async findById(id) {
    const result = await pool.query(
      `SELECT p.id_prof, p.no_empleado, u.nombre_usu, u.ap_usu, u.am_usu
       FROM profesor p
       JOIN usuarios u ON p.id_usu = u.id_usu
       WHERE p.id_usu = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findProfileById(id) {
    const result = await pool.query(
      `SELECT p.id_prof, p.no_empleado, u.nombre_usu, u.ap_usu, u.am_usu, u.correo_usu, u.estatus_usu
       FROM profesor p
       JOIN usuarios u ON p.id_usu = u.id_usu
       WHERE p.id_usu = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async getTeacherClasses(id, fecha) {
    const clasesResult = await pool.query(
      `SELECT r.id_aula, r.hora_entrada, r.hora_salida, a.nombre_aula, a.edificio
       FROM registros r
       JOIN aula a ON r.id_aula = a.id_aula
       WHERE r.id_usu = $1 AND r.fecha = $2
       ORDER BY r.hora_entrada`,
      [id, fecha]
    );
    return clasesResult.rows;
  }

  static async getClassStudents(id_aula, fecha, hora_entrada, hora_salida) {
    const alumnosResult = await pool.query(
      `SELECT u.nombre_usu, u.ap_usu, u.am_usu, a.matricula, a.grupo,
              r.hora_entrada, r.hora_salida
       FROM registros r
       JOIN usuarios u ON r.id_usu = u.id_usu
       JOIN alumnos a ON u.id_usu = a.id_usu
       WHERE r.id_aula = $1 AND r.fecha = $2 AND
             r.hora_entrada >= $3 AND r.hora_salida <= $4`,
      [id_aula, fecha, hora_entrada, hora_salida]
    );
    return alumnosResult.rows;
  }
}

module.exports = TeacherModel;
