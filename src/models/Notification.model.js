const { pool } = require('../config/database');

class NotificationModel {
  // Obtener notificaciones de un estudiante
  static async getStudentNotifications(id_usu) {
    const result = await pool.query(
      `SELECT id_notificacion, mensaje, fecha
       FROM notificaciones
       WHERE id_usu = $1
       ORDER BY fecha DESC`,
      [id_usu]
    );
    return result.rows;
  }

  // Enviar notificación a usuarios según tipo
  static async sendNotification(mensaje, tipo_destino) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let sqlUsuarios = 'SELECT id_usu FROM usuarios WHERE estatus_usu = true';
      const valores = [];

      if (tipo_destino === 1 || tipo_destino === 2) {
        sqlUsuarios += ' AND priv_usu = $1';
        valores.push(tipo_destino);
      }

      const usuariosResult = await client.query(sqlUsuarios, valores);

      if (usuariosResult.rows.length === 0) {
        throw new Error('No hay usuarios a los que enviar');
      }

      const fecha = new Date();

      for (const user of usuariosResult.rows) {
        await client.query(
          'INSERT INTO notificaciones (id_usu, mensaje, fecha) VALUES ($1, $2, $3)',
          [user.id_usu, mensaje, fecha]
        );
      }

      await client.query('COMMIT');

      return usuariosResult.rows.length;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = NotificationModel;