const ApiResponse = require('../utils/responses');
const ClassroomsService = require('../services/classrooms.service');

class ClassroomsController {
  static async getClassrooms(req, res, next) {
    try {
      const classrooms = await ClassroomsService.getAllClassrooms();
      return ApiResponse.success(res, classrooms);
    } catch (error) {
      next(error);
    }
  }

  static async createClassroom(req, res, next) {
    try {
      const { nombre_aula, edificio, id_dispositivo } = req.body;
      const result = await ClassroomsService.createClassroom({ nombre_aula, edificio, id_dispositivo });
      return ApiResponse.success(res, null, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateClassroom(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre_aula, edificio, id_dispositivo } = req.body;
      const result = await ClassroomsService.updateClassroom(id, { nombre_aula, edificio, id_dispositivo });
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClassroomsController;
