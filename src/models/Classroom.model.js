const { pool } = require('../config/database');

class ClassroomModel {
  // Obtener todas las aulas
  static async getAllClassrooms() {
    const result = await pool.query('SELECT * FROM aula ORDER BY edificio, nombre_aula');
    return result.rows;
  }

  // Crear nueva aula
  static async createClassroom(nombre_aula, edificio, id_dispositivo) {
    await pool.query(
      'INSERT INTO aula (nombre_aula, edificio, id_dispositivo) VALUES ($1, $2, $3)',
      [nombre_aula, edificio, id_dispositivo]
    );
  }

  // Actualizar aula existente
  static async updateClassroom(id, nombre_aula, edificio, id_dispositivo) {
    await pool.query(
      'UPDATE aula SET nombre_aula = $1, edificio = $2, id_dispositivo = $3 WHERE id_aula = $4',
      [nombre_aula, edificio, id_dispositivo || null, id]
    );
  }

  // Obtener mapa de aulas con estado y nombre del maestro actual (si está ocupada)
  static async getMapaAulas() {
    const result = await pool.query(`
      SELECT
        a.id_aula,
        a.nombre_aula,
        a.edificio,
        a.estado_aula,
        a.id_maestro_actual,
        CASE
          WHEN a.id_maestro_actual IS NOT NULL
          THEN u.nombre_usu || ' ' || u.ap_usu
          ELSE NULL
        END AS nombre_maestro
      FROM aula a
      LEFT JOIN usuarios u ON a.id_maestro_actual = u.id_usu
      ORDER BY a.edificio, a.nombre_aula
    `);
    return result.rows;
  }

  // Actualizar estado de un aula (semáforo)
  static async updateEstadoAula(id, estado_aula, id_maestro_actual) {
    const result = await pool.query(
      `UPDATE aula
       SET estado_aula = $1, id_maestro_actual = $2
       WHERE id_aula = $3
       RETURNING id_aula, nombre_aula, edificio, estado_aula, id_maestro_actual`,
      [estado_aula, id_maestro_actual || null, id]
    );
    return result.rows[0];
  }
}

module.exports = ClassroomModel;
