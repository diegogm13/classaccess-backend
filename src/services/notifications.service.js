// services/notifications.service.js
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
    if (!message) {
      throw { statusCode: 400, message: 'Mensaje requerido' };
    }

    const cantidad = await NotificationModel.sendNotification(message, target);
    logger.info('Notificaciones enviadas', { cantidad, target });
    return cantidad;
  }
}

module.exports = NotificationsService;
