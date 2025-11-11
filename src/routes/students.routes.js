const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');
const { sanitizeString, sanitizeParamId, validate } = require('../middlewares/sanitization');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Gestión de alumnos
 */

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Obtener información de un alumno por ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del alumno
 *     responses:
 *       200:
 *         description: Datos del alumno
 *       404:
 *         description: Alumno no encontrado
 */
router.get(
  '/:id',
  idValidation,
  sanitizeParamId('id'),
  validate,
  studentsController.getStudent
);

/**
 * @swagger
 * /students/{id}/history:
 *   get:
 *     summary: Obtener historial de asistencia o actividades de un alumno
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del alumno
 *     responses:
 *       200:
 *         description: Historial del alumno
 *       404:
 *         description: Alumno no encontrado
 */
router.get(
  '/:id/history',
  idValidation,
  sanitizeParamId('id'),
  validate,
  studentsController.getStudentHistory
);

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Actualizar datos de un alumno
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del alumno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_usu:
 *                 type: string
 *               ap_usu:
 *                 type: string
 *               am_usu:
 *                 type: string
 *               grupo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alumno actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Alumno no encontrado
 */
router.put(
  '/:id',
  authorize(1, 3),
  idValidation,
  sanitizeParamId('id'),
  sanitizeString('nombre_usu'),
  sanitizeString('ap_usu'),
  sanitizeString('am_usu'),
  sanitizeString('grupo'),
  validate,
  studentsController.updateStudent
);

module.exports = router;
