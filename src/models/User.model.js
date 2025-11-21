const { pool } = require('../config/database');

class UserModel {
  static async findAll() {
    const result = await pool.query('SELECT * FROM usuarios');
    return result.rows;
  }

  static async createUser(user) {
    const { nombre, ap, am, correo, hashedPassword, priv } = user;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO usuarios (nombre_usu, ap_usu, am_usu, correo_usu, password, priv_usu, estatus_usu)
         VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id_usu`,
        [nombre, ap, am, correo, hashedPassword, priv]
      );

      const idUsuario = userResult.rows[0].id_usu;

      return { client, idUsuario };
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  }

  static async insertAlumno(client, idUsuario, alumno) {
    const { matricula, cod_rfid, grupo } = alumno;
    await client.query(
      'INSERT INTO alumnos (id_usu, matricula, cod_rfid, grupo) VALUES ($1, $2, $3, $4)',
      [idUsuario, matricula, cod_rfid, grupo]
    );
  }

  static async insertProfesor(client, idUsuario, profesor) {
    const { no_empleado } = profesor;
    await client.query(
      'INSERT INTO profesor (id_usu, no_empleado) VALUES ($1, $2)',
      [idUsuario, no_empleado]
    );
  }

  static async updateStatus(id, estatus) {
    await pool.query(
      'UPDATE usuarios SET estatus_usu = $1 WHERE id_usu = $2',
      [estatus, id]
    );
  }
}

module.exports = UserModel;
