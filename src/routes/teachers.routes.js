const express = require('express');
const router = express.Router();
const teachersController = require('../controllers/teachers.controller');
const { authenticate } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');
const { sanitizeParamId, sanitizeDateQuery, validate } = require('../middlewares/sanitization');

// 🔒 Todos los endpoints requieren autenticación por cookie
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: Gestión de profesores
 */

/**
 * @swagger
 * /teachers/{id}:
 *   get:
 *     summary: Obtener información de un profesor por ID
 *     tags: [Teachers]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del profesor
 *     responses:
 *       200:
 *         description: Datos del profesor
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Profesor no encontrado
 */
router.get(
  '/:id',
  idValidation,
  sanitizeParamId('id'),
  validate,
  teachersController.getTeacher
);

/**
 * @swagger
 * /teachers/{id}/profile:
 *   get:
 *     summary: Obtener perfil completo de un profesor
 *     tags: [Teachers]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del profesor
 *     responses:
 *       200:
 *         description: Perfil completo del profesor
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Profesor no encontrado
 */
router.get(
  '/:id/profile',
  idValidation,
  sanitizeParamId('id'),
  validate,
  teachersController.getTeacherProfile
);

/**
 * @swagger
 * /teachers/{id}/lists:
 *   get:
 *     summary: Obtener listas de clases y alumnos de un profesor
 *     tags: [Teachers]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del profesor
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         description: Fecha para obtener las listas (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Listas de clases con alumnos
 *       400:
 *         description: Fecha requerida o formato inválido
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Profesor no encontrado
 */
router.get(
  '/:id/lists',
  idValidation,
  sanitizeParamId('id'),
  sanitizeDateQuery('fecha'), // ✅ USAR EL NUEVO MIDDLEWARE
  validate,
  teachersController.getTeacherLists
);

module.exports = router;