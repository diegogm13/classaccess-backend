const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { registerValidation, idValidation } = require('../middlewares/validation');
const { sanitizeString, sanitizeEmail, sanitizePassword, sanitizeParamId, validate } = require('../middlewares/sanitization');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear un nuevo usuario (público)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               ap:
 *                 type: string
 *               am:
 *                 type: string
 *               correo:
 *                 type: string
 *               password:
 *                 type: string
 *               priv:
 *                 type: integer
 *             required:
 *               - nombre
 *               - ap
 *               - am
 *               - correo
 *               - password
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post(
  '/',
  registerValidation,
  sanitizeString('nombre'),
  sanitizeString('ap'),
  sanitizeString('am'),
  sanitizeEmail('correo'),
  sanitizePassword('password'),
  validate,
  usersController.createUser
);

// 🔒 Endpoints protegidos
router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios (administrador)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autorizado
 */
router.get('/', authorize(3), usersController.getUsers);

/**
 * @swagger
 * /users/{id}/status:
 *   put:
 *     summary: Actualizar estatus de usuario (administrador)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Estatus actualizado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id/status',
  authorize(3),
  idValidation,
  sanitizeParamId('id'),
  validate,
  usersController.updateUserStatus
);

module.exports = router;
