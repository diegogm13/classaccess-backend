const { pool } = require('../config/database');

class AuthModel {
  /**
   * Buscar usuario por correo
   */
  static async findByCorreo(correo) {
    const query = `
      SELECT 
        id_usu, 
        nombre_usu, 
        ap_usu, 
        am_usu, 
        correo_usu, 
        password, 
        priv_usu, 
        estatus_usu
      FROM usuarios
      WHERE correo_usu = $1
    `;
    
    const result = await pool.query(query, [correo]);
    return result.rows[0] || null;
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        id_usu, 
        nombre_usu, 
        ap_usu, 
        am_usu, 
        correo_usu, 
        priv_usu, 
        estatus_usu
      FROM usuarios
      WHERE id_usu = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Guardar refresh token en la base de datos
   */
  static async saveRefreshToken(userId, refreshToken) {
    const query = `
      INSERT INTO refresh_tokens (id_usu, token, expira_en)
      VALUES ($1, $2, NOW() + INTERVAL '7 days')
      ON CONFLICT (id_usu) 
      DO UPDATE SET 
        token = EXCLUDED.token, 
        expira_en = EXCLUDED.expira_en
    `;
    
    await pool.query(query, [userId, refreshToken]);
  }

  /**
   * Verificar si el refresh token existe y es válido
   */
  static async verifyRefreshToken(refreshToken) {
    const query = `
      SELECT id_usu 
      FROM refresh_tokens 
      WHERE token = $1 AND expira_en > NOW()
    `;
    
    const result = await pool.query(query, [refreshToken]);
    return result.rows.length > 0;
  }

  /**
   * Eliminar refresh token (logout)
   */
  static async deleteRefreshToken(refreshToken) {
    const query = `DELETE FROM refresh_tokens WHERE token = $1`;
    await pool.query(query, [refreshToken]);
  }

  /**
   * Limpiar tokens expirados (mantenimiento)
   */
  static async cleanExpiredTokens() {
    const query = `DELETE FROM refresh_tokens WHERE expira_en < NOW()`;
    await pool.query(query);
  }
}

module.exports = AuthModel;