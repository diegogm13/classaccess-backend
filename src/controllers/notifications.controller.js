const ApiResponse = require('../utils/responses');
const NotificationsService = require('../services/notifications.service');

class NotificationsController {
  static async getStudentNotifications(req, res, next) {
    try {
      const notificaciones = await NotificationsService.getStudentNotifications(req.body.studentId);
      return ApiResponse.success(res, { notificaciones });
    } catch (error) {
      next(error);
    }
  }

  static async sendNotification(req, res, next) {
    try {
      await NotificationsService.sendNotification(req.body.message, req.body.target);
      return ApiResponse.success(res, null, 'Notificaciones enviadas correctamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationsController;
