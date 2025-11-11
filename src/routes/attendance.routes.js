const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { sanitizeString, validate } = require('../middlewares/sanitization');

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Registro de asistencia
 */

/**
 * @swagger
 * /attendance/register:
 *   get:
 *     summary: Registrar entrada/salida desde dispositivo IoT
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del alumno o profesor
 *       - in: query
 *         name: aula
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Registro exitoso (Entrada/Salida)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ALUMNO_ENTRADA
 */
router.get(
  '/register',
  sanitizeString('id'),
  sanitizeString('aula'),
  validate,
  attendanceController.registerAttendance
);

module.exports = router;
