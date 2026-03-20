const express = require('express');
const router = express.Router();
const guardiaController = require('../controllers/guardia.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { sanitizeParamId, sanitizeNumber, validate } = require('../middlewares/sanitization');
const { body } = require('express-validator');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Guardia
 *   description: Modulo de guardia - semaforo de aulas
 */

/**
 * @swagger
 * /guardia/mapa:
 *   get:
 *     summary: Obtener mapa de aulas con estado actual (semaforo)
 *     tags: [Guardia]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de aulas con estado y nombre del maestro si esta ocupada
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
 *                   estado_aula:
 *                     type: string
 *                     enum: [disponible, ocupada, mantenimiento]
 *                   id_maestro_actual:
 *                     type: integer
 *                     nullable: true
 *                   nombre_maestro:
 *                     type: string
 *                     nullable: true
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.get(
  '/mapa',
  authorize(3, 4),
  guardiaController.getMapaAulas
);

/**
 * @swagger
 * /guardia/classrooms/{id}/estado:
 *   put:
 *     summary: Actualizar estado de un aula (semaforo)
 *     tags: [Guardia]
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
 *               estado_aula:
 *                 type: string
 *                 enum: [disponible, ocupada, mantenimiento]
 *                 example: "ocupada"
 *               id_maestro_actual:
 *                 type: integer
 *                 nullable: true
 *                 example: 5
 *             required:
 *               - estado_aula
 *     responses:
 *       200:
 *         description: Estado del aula actualizado correctamente
 *       400:
 *         description: Datos invalidos
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Aula no encontrada
 */
router.put(
  '/classrooms/:id/estado',
  authorize(2, 3),
  sanitizeParamId('id'),
  body('estado_aula')
    .trim()
    .isIn(['disponible', 'ocupada', 'mantenimiento'])
    .withMessage('estado_aula debe ser: disponible, ocupada o mantenimiento'),
  body('id_maestro_actual')
    .optional({ nullable: true })
    .toInt()
    .isInt({ gt: 0 })
    .withMessage('id_maestro_actual debe ser un entero positivo'),
  validate,
  guardiaController.updateEstadoAula
);

module.exports = router;
