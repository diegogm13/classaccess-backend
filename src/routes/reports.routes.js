const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { sanitizeString, sanitizeDate, validate } = require('../middlewares/sanitization');

router.use(authenticate);
router.use(authorize(2, 3)); // Maestros y Administradores

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Gestión de reportes de asistencia
 */

/**
 * @swagger
 * /reports/attendance:
 *   get:
 *     summary: Obtener registros de asistencia filtrados por fecha o búsqueda
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha específica (YYYY-MM-DD)
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Matrícula del alumno o número de empleado del profesor
 *     responses:
 *       200:
 *         description: Lista de registros de asistencia
 *       400:
 *         description: Parámetros inválidos
 */
router.get(
  '/attendance',
  sanitizeDate('fecha'),
  sanitizeString('busqueda'),
  validate,
  reportsController.getAttendance
);

/**
 * @swagger
 * /reports/attendance/reports:
 *   get:
 *     summary: Obtener reportes de asistencia por fecha y grupo (AMBOS REQUERIDOS)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha específica (REQUERIDO)
 *       - in: query
 *         name: grupo
 *         required: true
 *         schema:
 *           type: string
 *         description: Grupo de alumnos (REQUERIDO)
 *     responses:
 *       200:
 *         description: Lista de reportes de asistencia
 *       400:
 *         description: Parámetros inválidos o faltantes
 */
router.get(
  '/attendance/reports',
  sanitizeDate('fecha'),
  sanitizeString('grupo'),
  validate,
  reportsController.getAttendanceReports
);

/**
 * @swagger
 * /reports/groups:
 *   get:
 *     summary: Obtener todos los grupos registrados
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de grupos (array simple de strings)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["1A", "1B", "2A", "2B"]
 */
router.get('/groups', reportsController.getGroups);

module.exports = router;