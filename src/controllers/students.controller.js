const ApiResponse = require('../utils/responses');
const StudentsService = require('../services/students.service');

class StudentsController {
  static async getStudent(req, res, next) {
    try {
      const student = await StudentsService.getStudentById(req.params.id);
      if (!student) return ApiResponse.notFound(res, 'Alumno no encontrado');
      return ApiResponse.success(res, student);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentHistory(req, res, next) {
    try {
      const history = await StudentsService.getStudentHistory(req.params.id);
      return ApiResponse.success(res, history);
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req, res, next) {
    try {
      const { nombre, ap, am, correo, matricula, cod_rfid, grupo } = req.body;
      await StudentsService.updateStudent(req.params.id, { nombre, ap, am, correo, matricula, cod_rfid, grupo });
      return ApiResponse.success(res, null, 'Perfil actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StudentsController;
