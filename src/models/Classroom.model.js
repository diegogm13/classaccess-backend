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
}

module.exports = ClassroomModel;
