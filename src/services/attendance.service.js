const AttendanceModel = require('../models/Attendance.model');
const logger = require('../utils/logger');

class AttendanceService {
  /**
   * Registrar asistencia de un usuario (alumno o profesor)
   * @param {string} id - ID proporcionado (matrícula, RFID o número de empleado)
   * @param {string} id_aula - ID del aula
   * @returns {Promise<string>} - Mensaje del tipo de registro
   */
  static async registerAttendance(id, id_aula) {
    // Buscar profesor
    const prof = await AttendanceModel.findProfessorByNoEmpleado(id);
    if (prof) {
      return await AttendanceService.registerEntryExit(prof.id_usu, id_aula, "PROFESOR");
    }

    // Verificar si hay profesor en el aula hoy
    const hayProfesor = await AttendanceModel.isProfessorInClassToday(id_aula);
    if (!hayProfesor) {
      logger.warn('Intento de registro sin profesor en aula', { id, id_aula });
      return "NO_HAY_PROFESOR";
    }

    // Buscar alumno
    const alum = await AttendanceModel.findStudentById(id);
    if (!alum) {
      logger.warn('Usuario no encontrado', { id });
      return "NO_ENCONTRADO";
    }

    return await AttendanceService.registerEntryExit(alum.id_usu, id_aula, "ALUMNO");
  }

  /**
   * Registrar entrada o salida
   * @param {number} id_usu - ID de usuario en la DB
   * @param {string} id_aula - ID del aula
   * @param {string} tipo - "ALUMNO" o "PROFESOR"
   * @returns {Promise<string>} - Mensaje de entrada o salida
   */
  static async registerEntryExit(id_usu, id_aula, tipo) {
    const registroAbierto = await AttendanceModel.checkOpenAttendance(id_usu, id_aula);

    if (registroAbierto) {
      await AttendanceModel.updateExit(registroAbierto.id_registro);
      logger.info('Salida registrada', { userId: id_usu, aula: id_aula, tipo });
      return `${tipo}_SALIDA`;
    } else {
      await AttendanceModel.insertEntry(id_usu, id_aula);
      logger.info('Entrada registrada', { userId: id_usu, aula: id_aula, tipo });
      return `${tipo}_ENTRADA`;
    }
  }
}

module.exports = AttendanceService;
