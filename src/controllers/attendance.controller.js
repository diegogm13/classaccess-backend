const AttendanceService = require('../services/attendance.service');
const logger = require('../utils/logger');

class AttendanceController {
  static async registerAttendance(req, res, next) {
    const { id, aula: id_aula } = req.query;

    if (!id || !id_aula) {
      return res.status(400).send("ID o AULA no proporcionado");
    }

    try {
      const message = await AttendanceService.registerAttendance(id, id_aula);
      res.send(message);
    } catch (error) {
      logger.error('Error en registro de asistencia', { error: error.message, id, id_aula });
      res.status(500).send("Error en el servidor");
    }
  }
}

module.exports = AttendanceController;
