const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { sanitizeString, sanitizeNumber, validate } = require('../middlewares/sanitization');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestión de notificaciones
 */

/**
 * @swagger
 * /notifications/student:
 *   post:
 *     summary: Obtener notificaciones de un estudiante
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: integer
 *             required:
 *               - studentId
 *     responses:
 *       200:
 *         description: Lista de notificaciones del estudiante
 *       400:
 *         description: Datos inválidos
 */
router.post(
  '/student',
  sanitizeNumber('studentId'), // reemplazamos sanitizeInt
  validate,
  notificationsController.getStudentNotifications
);

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Enviar notificación (solo administradores)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               target:
 *                 type: integer
 *             required:
 *               - message
 *               - target
 *     responses:
 *       200:
 *         description: Notificación enviada correctamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No autorizado
 */
router.post(
  '/send',
  authorize(3),
  sanitizeString('message'),
  sanitizeNumber('target'), // reemplazamos sanitizeInt
  validate,
  notificationsController.sendNotification
);

module.exports = router;
