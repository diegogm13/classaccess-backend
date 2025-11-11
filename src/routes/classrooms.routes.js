const express = require('express');
const router = express.Router();
const classroomsController = require('../controllers/classrooms.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');
const { sanitizeString, sanitizeNumber, validate } = require('../middlewares/sanitization');

router.use(authenticate);
router.use(authorize(3)); // Solo administradores

/**
 * @swagger
 * tags:
 *   name: Classrooms
 *   description: Gestión de aulas
 */

/**
 * @swagger
 * /classrooms:
 *   get:
 *     summary: Obtener todas las aulas
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de aulas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_aula:
 *                     type: integer
 *                   nombre_aula:
 *                     type: string
 *                   edificio:
 *                     type: string
 *                   id_dispositivo:
 *                     type: integer
 */
router.get('/', classroomsController.getClassrooms);

/**
 * @swagger
 * /classrooms:
 *   post:
 *     summary: Crear una nueva aula
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_aula:
 *                 type: string
 *                 example: "Aula 102"
 *               edificio:
 *                 type: string
 *                 example: "Edificio A"
 *               id_dispositivo:
 *                 type: integer
 *                 example: 1
 *             required:
 *               - nombre_aula
 *               - edificio
 *               - id_dispositivo
 *     responses:
 *       201:
 *         description: Aula creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post(
  '/',
  sanitizeString('nombre_aula'),
  sanitizeString('edificio'),
  sanitizeNumber('id_dispositivo'),
  validate,
  classroomsController.createClassroom
);

/**
 * @swagger
 * /classrooms/{id}:
 *   put:
 *     summary: Actualizar aula existente
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del aula
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_aula:
 *                 type: string
 *                 example: "Aula 101 - Actualizada"
 *               edificio:
 *                 type: string
 *                 example: "Edificio A"
 *               id_dispositivo:
 *                 type: integer
 *                 example: 2
 *             required:
 *               - nombre_aula
 *               - edificio
 *               - id_dispositivo
 *     responses:
 *       200:
 *         description: Aula actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Aula no encontrada
 */
router.put(
  '/:id',
  idValidation,
  sanitizeString('nombre_aula'),
  sanitizeString('edificio'),
  sanitizeNumber('id_dispositivo'),
  validate,
  classroomsController.updateClassroom
);

module.exports = router;
