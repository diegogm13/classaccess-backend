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
 *     summary: Obtener reportes de asistencia por grupo y rango de fechas
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha específica
 *       - in: query
 *         name: grupo
 *         schema:
 *           type: string
 *         description: Grupo de alumnos
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del rango
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del rango
 *     responses:
 *       200:
 *         description: Lista de reportes de asistencia
 *       400:
 *         description: Parámetros inválidos
 */
router.get(
  '/attendance/reports',
  sanitizeDate('fecha'),
  sanitizeString('grupo'),
  sanitizeDate('fechaInicio'),
  sanitizeDate('fechaFin'),
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
 *         description: Lista de grupos
 */
router.get('/groups', reportsController.getGroups);

module.exports = router;
