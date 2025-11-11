const StudentModel = require('../models/Student.model');
const logger = require('../utils/logger');

class StudentsService {
  static async getStudentById(id) {
    const student = await StudentModel.getStudent(id);
    if (!student) return null;
    delete student.password; // Limpiar info sensible
    return student;
  }

  static async getStudentHistory(id) {
    const history = await StudentModel.getStudentHistory(id);
    return history;
  }

  static async updateStudent(id, data) {
    await StudentModel.updateStudent(id, data);
    logger.info('Perfil de alumno actualizado', { studentId: id });
  }
}

module.exports = StudentsService;
