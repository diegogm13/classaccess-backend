const ApiResponse = require('../utils/responses');
const GuardiaService = require('../services/guardia.service');
const logger = require('../utils/logger');

class GuardiaController {
  /**
   * GET /guardia/mapa
   * Devuelve todas las aulas con estado actual + nombre del maestro si está ocupada.
   * Permitido para: guardia (priv_usu=4) y admin (priv_usu=3).
   */
  static async getMapaAulas(req, res, next) {
    try {
      const aulas = await GuardiaService.getMapaAulas();
      logger.info('Mapa de aulas solicitado', { userId: req.user.id, priv: req.user.priv_usu });
      return ApiResponse.success(res, aulas);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /guardia/classrooms/:id/estado
   * Actualiza el estado (semáforo) de un aula.
   * Permitido para: maestro (priv_usu=2) y admin (priv_usu=3).
   */
  static async updateEstadoAula(req, res, next) {
    try {
      const { id } = req.params;
      const { estado_aula, id_maestro_actual } = req.body;
      const requesterPriv = req.user.priv_usu;
      const requesterId = req.user.id;

      const aulaActualizada = await GuardiaService.updateEstadoAula(
        id,
        estado_aula,
        id_maestro_actual || null,
        requesterPriv,
        requesterId
      );

      logger.info('Estado de aula actualizado via endpoint', {
        id_aula: id,
        estado_aula,
        userId: requesterId
      });

      return ApiResponse.success(res, aulaActualizada, 'Estado del aula actualizado correctamente');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

module.exports = GuardiaController;
