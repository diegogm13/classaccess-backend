const express = require('express');
const router = express.Router();
const teachersController = require('../controllers/teachers.controller');
const { authenticate } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');
const { sanitizeParamId, validate } = require('../middlewares/sanitization');

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
 *       - bearerAuth: []
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
 *     summary: Obtener perfil de un profesor
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del profesor
 *     responses:
 *       200:
 *         description: Perfil del profesor
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
 *     summary: Obtener listas asociadas a un profesor
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del profesor
 *     responses:
 *       200:
 *         description: Listas del profesor
 *       404:
 *         description: Profesor no encontrado
 */
router.get(
  '/:id/lists',
  idValidation,
  sanitizeParamId('id'),
  validate,
  teachersController.getTeacherLists
);

module.exports = router;
