const logger = require('../utils/logger');
const NotificationModel = require('../models/Notification.model');

class NotificationsService {
  static async getStudentNotifications(studentId) {
    if (!studentId) {
      throw { statusCode: 400, message: 'ID de estudiante requerido' };
    }

    const notificaciones = await NotificationModel.getStudentNotifications(studentId);
    return notificaciones;
  }

  static async sendNotification(message, target) {
    if (!message || message.trim() === '') {
      throw { statusCode: 400, message: 'Mensaje requerido' };
    }

    if (![1, 2, 3].includes(target)) {
      throw { statusCode: 400, message: 'Target inválido. Debe ser 1 (alumnos), 2 (maestros) o 3 (todos)' };
    }

    const cantidad = await NotificationModel.sendNotification(message, target);
    
    if (cantidad === 0) {
      throw { statusCode: 404, message: 'No se encontraron usuarios a los que enviar' };
    }

    logger.info('Notificaciones enviadas', { cantidad, target });
    return cantidad;
  }
}

module.exports = NotificationsService;