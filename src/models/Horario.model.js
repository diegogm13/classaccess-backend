const { pool } = require('../config/database');

class HorarioModel {
  // Obtener todos los horarios/grupos
  static async getAllHorarios() {
    const result = await pool.query('SELECT * FROM horarios ORDER BY clave');
    return result.rows;
  }

  // Crear nuevo horario/grupo
  static async createHorario({
    clave,
    nombre,
    turno,
    hora_inicio,
    hora_fin,
    dias_laborales,
    edificio,
    aula,
    docente,
    alumnos_inscritos,
  }) {
    const result = await pool.query(
      `INSERT INTO horarios
        (clave, nombre, turno, hora_inicio, hora_fin, dias_laborales, edificio, aula, docente, alumnos_inscritos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        clave,
        nombre,
        turno,
        hora_inicio,
        hora_fin,
        dias_laborales,
        edificio || null,
        aula || null,
        docente || null,
        alumnos_inscritos || 0,
      ]
    );
    return result.rows[0];
  }

  // Actualizar horario/grupo existente
  static async updateHorario(id, {
    clave,
    nombre,
    turno,
    hora_inicio,
    hora_fin,
    dias_laborales,
    edificio,
    aula,
    docente,
    alumnos_inscritos,
  }) {
    const result = await pool.query(
      `UPDATE horarios
       SET clave = $1, nombre = $2, turno = $3, hora_inicio = $4, hora_fin = $5,
           dias_laborales = $6, edificio = $7, aula = $8, docente = $9,
           alumnos_inscritos = $10, actualizado_en = now()
       WHERE id_horario = $11
       RETURNING *`,
      [
        clave,
        nombre,
        turno,
        hora_inicio,
        hora_fin,
        dias_laborales,
        edificio || null,
        aula || null,
        docente || null,
        alumnos_inscritos || 0,
        id,
      ]
    );
    return result.rows[0];
  }

  // Eliminar horario/grupo
  static async deleteHorario(id) {
    const result = await pool.query(
      'DELETE FROM horarios WHERE id_horario = $1 RETURNING id_horario',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = HorarioModel;
