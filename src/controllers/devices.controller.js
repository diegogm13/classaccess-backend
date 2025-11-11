const ApiResponse = require('../utils/responses');
const DevicesService = require('../services/devices.service');

class DevicesController {
  static async getDevices(req, res, next) {
    try {
      const devices = await DevicesService.getDevices();
      return ApiResponse.success(res, devices);
    } catch (error) {
      next(error);
    }
  }

  static async createDevice(req, res, next) {
    try {
      await DevicesService.createDevice(req.body.nombre_dis);
      return ApiResponse.success(res, null, 'Dispositivo agregado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateDeviceStatus(req, res, next) {
    try {
      await DevicesService.updateDeviceStatus(req.params.id, req.body.estatus);
      return ApiResponse.success(res, null, 'Estatus actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DevicesController;
