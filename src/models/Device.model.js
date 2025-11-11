const { pool } = require('../config/database');

class DeviceModel {
  // Obtener todos los dispositivos
  static async getAllDevices() {
    const result = await pool.query('SELECT * FROM dispositivo ORDER BY id_dispositivo');
    return result.rows;
  }

  // Crear nuevo dispositivo
  static async createDevice(nombre_dis) {
    await pool.query(
      'INSERT INTO dispositivo (nombre_dis, estatus_dis) VALUES ($1, true)',
      [nombre_dis]
    );
  }

  // Actualizar estatus de un dispositivo
  static async updateDeviceStatus(id, estatus) {
    await pool.query(
      'UPDATE dispositivo SET estatus_dis = $1 WHERE id_dispositivo = $2',
      [estatus, id]
    );
  }
}

module.exports = DeviceModel;
