const ClassroomModel = require('../models/Classroom.model');
const AttendanceModel = require('../models/Attendance.model');
const logger = require('../utils/logger');

class Esp32Controller {
  /**
   * GET /api/esp32/estado?aula={id_aula}
   * Endpoint público para ESP32: devuelve si el aula está ocupada o disponible.
   * El ESP32 usa esta respuesta para abrir o cerrar la chapa en el pin 18.
   */
  static async getEstadoAula(req, res) {
    const { aula } = req.query;

    if (!aula || isNaN(parseInt(aula))) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro aula inválido o no proporcionado'
      });
    }

    const id_aula = parseInt(aula);

    try {
      const aulaData = await ClassroomModel.getEstadoAulaById(id_aula);

      if (!aulaData) {
        return res.status(404).json({
          success: false,
          message: 'Aula no encontrada'
        });
      }

      // Verificar también si hay un profesor activo hoy (sin hora_salida)
      const profesorActivo = await AttendanceModel.isProfessorInClassToday(id_aula);

      // El aula se considera "ocupada" si el semáforo lo dice O si hay un profesor activo
      const ocupada = aulaData.estado_aula === 'ocupada' || profesorActivo;

      logger.info('ESP32 consulta estado aula', {
        id_aula,
        estado_semaforo: aulaData.estado_aula,
        profesor_activo: profesorActivo,
        resultado: ocupada ? 'ocupada' : 'disponible'
      });

      return res.json({
        success: true,
        id_aula: aulaData.id_aula,
        nombre_aula: aulaData.nombre_aula,
        estado: ocupada ? 'ocupada' : 'disponible',
        abrir_chapa: ocupada   // true = abrir, false = cerrar
      });

    } catch (error) {
      logger.error('Error al consultar estado de aula para ESP32', {
        error: error.message,
        id_aula
      });
      return res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }
}

module.exports = Esp32Controller;
