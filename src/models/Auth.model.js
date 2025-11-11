const { pool } = require('../config/database');

class AuthModel {
  // Buscar usuario por correo
  static async findUserByEmail(correo) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE correo_usu = $1 AND estatus_usu = true',
      [correo]
    );
    return result.rows[0];
  }

  // Guardar refresh token en BD
  static async saveRefreshToken(userId, refreshToken) {
    await pool.query(
      'UPDATE usuarios SET refresh_token = $1 WHERE id_usu = $2',
      [refreshToken, userId]
    );
  }

  // Buscar usuario por refresh token
  static async findUserByRefreshToken(refreshToken) {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE refresh_token = $1',
      [refreshToken]
    );
    return result.rows[0];
  }

  // Eliminar refresh token
  static async deleteRefreshToken(userId) {
    await pool.query(
      'UPDATE usuarios SET refresh_token = NULL WHERE id_usu = $1',
      [userId]
    );
  }
}

module.exports = AuthModel;
