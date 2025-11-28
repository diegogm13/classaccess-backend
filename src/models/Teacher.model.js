const { pool } = require('../config/database');

class TeacherModel {
  /**
   * Obtener información básica de un profesor por ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        p.id_prof, 
        p.no_empleado, 
        u.id_usu,
        u.nombre_usu, 
        u.ap_usu, 
        u.am_usu,
        u.priv_usu,
        u.estatus_usu
      FROM profesor p
      JOIN usuarios u ON p.id_usu = u.id_usu
      WHERE p.id_usu = $1 AND u.priv_usu = 2
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener perfil completo de un profesor
   */
  static async findProfileById(id) {
    const query = `
      SELECT 
        p.id_prof, 
        p.no_empleado, 
        u.id_usu,
        u.nombre_usu, 
        u.ap_usu, 
        u.am_usu, 
        u.correo_usu, 
        u.priv_usu,
        u.estatus_usu
      FROM profesor p
      JOIN usuarios u ON p.id_usu = u.id_usu
      WHERE p.id_usu = $1 AND u.priv_usu = 2
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todas las clases de un profesor en una fecha específica
   */
  static async getTeacherClasses(id, fecha) {
    const query = `
      SELECT 
        r.id_aula, 
        r.hora_entrada, 
        r.hora_salida, 
        a.nombre_aula, 
        a.edificio
      FROM registros r
      JOIN aula a ON r.id_aula = a.id_aula
      WHERE r.id_usu = $1 AND r.fecha = $2
      ORDER BY r.hora_entrada
    `;
    
    const result = await pool.query(query, [id, fecha]);
    return result.rows;
  }

  /**
   * Obtener lista de alumnos de una clase específica
   */
  static async getClassStudents(id_aula, fecha, hora_entrada, hora_salida) {
    const query = `
      SELECT 
        u.id_usu,
        u.nombre_usu, 
        u.ap_usu, 
        u.am_usu, 
        a.matricula, 
        a.grupo,
        r.hora_entrada, 
        r.hora_salida
      FROM registros r
      JOIN usuarios u ON r.id_usu = u.id_usu
      JOIN alumnos a ON u.id_usu = a.id_usu
      WHERE r.id_aula = $1 
        AND r.fecha = $2 
        AND r.hora_entrada >= $3 
        AND r.hora_salida <= $4
      ORDER BY u.ap_usu, u.am_usu, u.nombre_usu
    `;
    
    const result = await pool.query(query, [id_aula, fecha, hora_entrada, hora_salida]);
    return result.rows;
  }

  /**
   * Verificar si un usuario es profesor
   */
  static async isTeacher(id_usu) {
    const query = 'SELECT priv_usu FROM usuarios WHERE id_usu = $1';
    const result = await pool.query(query, [id_usu]);
    return result.rows[0]?.priv_usu === 2;
  }
}

module.exports = TeacherModel;