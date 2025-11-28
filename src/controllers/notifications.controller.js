const ApiResponse = require('../utils/responses');
const NotificationsService = require('../services/notifications.service');
const logger = require('../utils/logger');

class NotificationsController {
  /**
   * GET /notifications/:id - Obtener notificaciones de un estudiante
   */
  static async getStudentNotifications(req, res, next) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterPriv = req.user.priv_usu;

      // 🔒 Estudiante solo puede ver sus propias notificaciones
      // Maestros y administradores pueden ver cualquier notificación
      if (requesterPriv === 1 && requesterId !== parseInt(id)) {
        logger.warn('Estudiante intentó acceder a notificaciones de otro usuario', {
          requesterId,
          targetId: id
        });
        return ApiResponse.error(res, 'No tienes permiso para ver estas notificaciones', 403);
      }

      const notificaciones = await NotificationsService.getStudentNotifications(id);

      logger.info('Notificaciones obtenidas', { 
        studentId: id, 
        requesterId,
        count: notificaciones.length 
      });

      return ApiResponse.success(res, { notificaciones });
    } catch (error) {
      logger.error('Error al obtener notificaciones', { 
        error: error.message,
        studentId: req.params.id 
      });
      next(error);
    }
  }

  /**
   * POST /notifications/send - Enviar notificación (solo administradores)
   */
  static async sendNotification(req, res, next) {
    try {
      const requesterId = req.user.id;
      const { message, target } = req.body;

      const cantidad = await NotificationsService.sendNotification(message, target);

      logger.info('Notificaciones enviadas', { 
        cantidad, 
        target, 
        sentBy: requesterId 
      });

      return ApiResponse.success(res, { cantidad }, 'Notificaciones enviadas correctamente');
    } catch (error) {
      logger.error('Error al enviar notificaciones', { 
        error: error.message,
        userId: req.user.id 
      });
      next(error);
    }
  }
}

module.exports = NotificationsController;