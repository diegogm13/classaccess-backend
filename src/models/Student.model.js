// models/Student.model.js
const { pool } = require('../config/database');

class StudentModel {
  /**
   * Obtener información de un alumno por ID
   * Usa LEFT JOIN para que funcione incluso si no hay registro en alumnos
   */
  static async getStudent(id) {
    const query = `
      SELECT 
        u.id_usu,
        u.nombre_usu, 
        u.ap_usu, 
        u.am_usu, 
        u.correo_usu, 
        u.priv_usu, 
        u.estatus_usu,
        a.id_alumno,
        a.matricula, 
        a.cod_rfid, 
        a.grupo 
      FROM usuarios u
      LEFT JOIN alumnos a ON u.id_usu = a.id_usu
      WHERE u.id_usu = $1 AND u.priv_usu = 1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener historial de asistencia de un alumno
   */
  static async getStudentHistory(id) {
    const query = `
      SELECT 
        r.id_registro,
        r.fecha, 
        r.hora_entrada, 
        r.hora_salida, 
        a.nombre_aula, 
        a.edificio
      FROM registros r
      LEFT JOIN aula a ON r.id_aula = a.id_aula
      WHERE r.id_usu = $1
      ORDER BY r.fecha DESC, r.hora_entrada DESC
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows;
  }

  /**
   * Actualizar información de un alumno
   * Si no existe registro en alumnos, lo crea
   */
  static async updateStudent(id, { nombre, ap, am, correo, matricula, cod_rfid, grupo }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Actualizar datos en tabla usuarios
      await client.query(
        `UPDATE usuarios 
         SET nombre_usu = $1, ap_usu = $2, am_usu = $3, correo_usu = $4 
         WHERE id_usu = $5`,
        [nombre, ap, am, correo, id]
      );

      // 2. Verificar si existe registro en alumnos
      const alumnoExiste = await client.query(
        'SELECT id_alumno FROM alumnos WHERE id_usu = $1',
        [id]
      );

      if (alumnoExiste.rows.length > 0) {
        // Si existe, hacer UPDATE
        await client.query(
          `UPDATE alumnos 
           SET matricula = $1, cod_rfid = $2, grupo = $3 
           WHERE id_usu = $4`,
          [matricula, cod_rfid, grupo, id]
        );
      } else {
        // Si no existe, hacer INSERT
        await client.query(
          `INSERT INTO alumnos (id_usu, matricula, cod_rfid, grupo) 
           VALUES ($1, $2, $3, $4)`,
          [id, matricula, cod_rfid, grupo]
        );
      }

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Crear registro de alumno si no existe
   */
  static async createAlumnoRecord(id_usu, matricula = null, cod_rfid = null, grupo = null) {
    const query = `
      INSERT INTO alumnos (id_usu, matricula, cod_rfid, grupo)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id_usu) DO NOTHING
      RETURNING *
    `;
    
    const result = await pool.query(query, [id_usu, matricula, cod_rfid, grupo]);
    return result.rows[0];
  }

  /**
   * Verificar si un usuario es alumno
   */
  static async isStudent(id_usu) {
    const query = 'SELECT priv_usu FROM usuarios WHERE id_usu = $1';
    const result = await pool.query(query, [id_usu]);
    return result.rows[0]?.priv_usu === 1;
  }
}

module.exports = StudentModel;