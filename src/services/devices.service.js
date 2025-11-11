// services/devices.service.js
const logger = require('../utils/logger');
const DeviceModel = require('../models/Device.model');

class DevicesService {
  static async getDevices() {
    return await DeviceModel.getAllDevices();
  }

  static async createDevice(nombre_dis) {
    if (!nombre_dis) {
      throw { statusCode: 400, message: 'Nombre del dispositivo requerido' };
    }

    await DeviceModel.createDevice(nombre_dis);
    logger.info('Dispositivo creado', { nombre_dis });
  }

  static async updateDeviceStatus(id, estatus) {
    await DeviceModel.updateDeviceStatus(id, estatus);
    logger.info('Estatus de dispositivo actualizado', { deviceId: id, estatus });
  }
}

module.exports = DevicesService;
