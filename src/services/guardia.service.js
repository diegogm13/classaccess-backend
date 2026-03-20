const ClassroomModel = require('../models/Classroom.model');
const logger = require('../utils/logger');

const ESTADOS_VALIDOS = ['disponible', 'ocupada', 'mantenimiento'];

class GuardiaService {
  /**
   * Obtiene todas las aulas con su estado actual y nombre del maestro si aplica.
   * Usado por el mapa de edificios del guardia y el admin.
   */
  static async getMapaAulas() {
    try {
      const aulas = await ClassroomModel.getMapaAulas();
      logger.info('Mapa de aulas obtenido', { total: aulas.length });
      return aulas;
    } catch (error) {
      logger.error('Error obteniendo mapa de aulas', { error: error.message });
      throw error;
    }
  }

  /**
   * Actualiza el estado (semáforo) de un aula.
   * Quién puede llamarlo: maestro (priv_usu=2) o admin (priv_usu=3).
   *
   * Reglas de negocio:
   *  - Si estado_aula = 'ocupada', id_maestro_actual debe ser provisto.
   *  - Si estado_aula = 'disponible' o 'mantenimiento', id_maestro_actual se limpia.
   */
  static async updateEstadoAula(id_aula, estado_aula, id_maestro_actual, requesterPriv, requesterId) {
    if (!ESTADOS_VALIDOS.includes(estado_aula)) {
      const error = new Error(`estado_aula inválido. Debe ser: ${ESTADOS_VALIDOS.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    if (estado_aula === 'ocupada' && !id_maestro_actual) {
      const error = new Error('Se requiere id_maestro_actual cuando el estado es "ocupada"');
      error.statusCode = 400;
      throw error;
    }

    // Si es maestro (priv=2), solo puede asignarse a sí mismo como maestro_actual
    if (requesterPriv === 2 && id_maestro_actual && id_maestro_actual !== requesterId) {
      const error = new Error('Un maestro solo puede registrarse a sí mismo como ocupante del aula');
      error.statusCode = 403;
      throw error;
    }

    // Si el estado no es 'ocupada', limpiar el maestro actual
    const maestroFinal = estado_aula === 'ocupada' ? (id_maestro_actual || null) : null;

    try {
      const aulaActualizada = await ClassroomModel.updateEstadoAula(id_aula, estado_aula, maestroFinal);

      if (!aulaActualizada) {
        const error = new Error('Aula no encontrada');
        error.statusCode = 404;
        throw error;
      }

      logger.info('Estado de aula actualizado', {
        id_aula,
        estado_aula,
        maestroFinal,
        actualizadoPor: requesterId
      });

      return aulaActualizada;
    } catch (error) {
      logger.error('Error actualizando estado de aula', { error: error.message, id_aula });
      throw error;
    }
  }
}

module.exports = GuardiaService;
