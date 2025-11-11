const { pool } = require('../config/database');

class StudentModel {
  // Obtener información de un alumno por ID
  static async getStudent(id) {
    const result = await pool.query(
      `SELECT u.*, a.matricula, a.cod_rfid, a.grupo 
       FROM usuarios u
       JOIN alumnos a ON u.id_usu = a.id_usu
       WHERE u.id_usu = $1`,
      [id]
    );

    return result.rows[0]; // puede ser undefined si no existe
  }

  // Obtener historial de asistencia de un alumno
  static async getStudentHistory(id) {
    const result = await pool.query(
      `SELECT r.fecha, r.hora_entrada, r.hora_salida, a.nombre_aula, a.edificio
       FROM registros r
       LEFT JOIN aula a ON r.id_aula = a.id_aula
       WHERE r.id_usu = $1
       ORDER BY r.fecha DESC, r.hora_entrada DESC`,
      [id]
    );

    return result.rows;
  }

  // Actualizar información de un alumno
  static async updateStudent(id, { nombre, ap, am, correo, matricula, cod_rfid, grupo }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE usuarios SET nombre_usu = $1, ap_usu = $2, am_usu = $3, correo_usu = $4 WHERE id_usu = $5',
        [nombre, ap, am, correo, id]
      );

      await client.query(
        'UPDATE alumnos SET matricula = $1, cod_rfid = $2, grupo = $3 WHERE id_usu = $4',
        [matricula, cod_rfid, grupo, id]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = StudentModel;
