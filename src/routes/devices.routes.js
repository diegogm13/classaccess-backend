const express = require('express');
const router = express.Router();
const devicesController = require('../controllers/devices.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');
const { sanitizeString, sanitizeBoolean, validate } = require('../middlewares/sanitization');

router.use(authenticate);
router.use(authorize(3)); // Solo administradores

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Gestión de dispositivos
 */

/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Obtener todos los dispositivos
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de dispositivos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_dispositivo:
 *                     type: integer
 *                   nombre_dispositivo:
 *                     type: string
 *                   descripcion:
 *                     type: string
 *                   estatus:
 *                     type: boolean
 */
router.get('/', devicesController.getDevices);

/**
 * @swagger
 * /devices:
 *   post:
 *     summary: Crear un nuevo dispositivo
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_dispositivo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               estatus:
 *                 type: boolean
 *             required:
 *               - nombre_dispositivo
 *               - estatus
 *     responses:
 *       201:
 *         description: Dispositivo creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post(
  '/',
  sanitizeString('nombre_dis'),
  sanitizeString('descripcion'),
  sanitizeBoolean('estatus'),
  validate,
  devicesController.createDevice
);

/**
 * @swagger
 * /devices/{id}/status:
 *   put:
 *     summary: Actualizar estatus de un dispositivo
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del dispositivo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estatus:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estatus actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Dispositivo no encontrado
 */
router.put(
  '/:id/status',
  idValidation,
  sanitizeBoolean('estatus'),
  validate,
  devicesController.updateDeviceStatus
);

module.exports = router;
