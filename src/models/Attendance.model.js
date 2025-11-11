const { pool } = require('../config/database');

class AttendanceModel {
  static async findProfessorByNoEmpleado(no_empleado) {
    const result = await pool.query(
      `SELECT u.id_usu FROM profesor p
       JOIN usuarios u ON p.id_usu = u.id_usu
       WHERE p.no_empleado = $1`,
      [no_empleado]
    );
    return result.rows[0];
  }

  static async isProfessorInClassToday(id_aula) {
    const result = await pool.query(
      `SELECT r.id_registro FROM registros r
       JOIN profesor p ON r.id_usu = p.id_usu
       WHERE r.id_aula = $1 AND r.fecha = CURRENT_DATE`,
      [id_aula]
    );
    return result.rows.length > 0;
  }

  static async findStudentById(id) {
    const result = await pool.query(
      `SELECT u.id_usu FROM alumnos a
       JOIN usuarios u ON a.id_usu = u.id_usu
       WHERE a.matricula = $1 OR a.cod_rfid = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async checkOpenAttendance(id_usu, id_aula) {
    const result = await pool.query(
      `SELECT * FROM registros
       WHERE id_usu = $1 AND id_aula = $2 AND fecha = CURRENT_DATE AND hora_salida IS NULL`,
      [id_usu, id_aula]
    );
    return result.rows[0];
  }

  static async insertEntry(id_usu, id_aula) {
    await pool.query(
      'INSERT INTO registros (fecha, id_usu, id_aula, hora_entrada) VALUES (CURRENT_DATE, $1, $2, CURRENT_TIME)',
      [id_usu, id_aula]
    );
  }

  static async updateExit(id_registro) {
    await pool.query(
      'UPDATE registros SET hora_salida = CURRENT_TIME WHERE id_registro = $1',
      [id_registro]
    );
  }
}

module.exports = AttendanceModel;
