const ApiResponse = require('../utils/responses');
const TeachersService = require('../services/teachers.service');

class TeachersController {
  static async getTeacher(req, res, next) {
    try {
      const teacher = await TeachersService.getTeacherById(req.params.id);
      if (!teacher) return ApiResponse.notFound(res, 'Profesor no encontrado');
      return ApiResponse.success(res, teacher);
    } catch (error) {
      next(error);
    }
  }

  static async getTeacherProfile(req, res, next) {
    try {
      const profile = await TeachersService.getTeacherProfile(req.params.id);
      if (!profile) return ApiResponse.notFound(res, 'Profesor no encontrado');
      return ApiResponse.success(res, profile);
    } catch (error) {
      next(error);
    }
  }

  static async getTeacherLists(req, res, next) {
    const { id } = req.params;
    const { fecha } = req.query;

    try {
      const resultados = await TeachersService.getTeacherLists(id, fecha);
      return ApiResponse.success(res, resultados);
    } catch (error) {
      return ApiResponse.error(res, error.message, 400);
    }
  }
}

module.exports = TeachersController;
