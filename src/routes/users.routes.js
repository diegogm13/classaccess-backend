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
 * /registrarUsuario:
 *   post:
 *     summary: Registrar un nuevo usuario (Alumno / Maestro / Admin)
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
 *                 description: 1=Alumno, 2=Maestro, 3=Administrador
 *               matricula:
 *                 type: string
 *               cod_rfid:
 *                 type: string
 *               grupo:
 *                 type: string
 *               no_empleado:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post(
  '/registrarUsuario',
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
 *     summary: Obtener todos los usuarios (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authorize(3), usersController.getUsers);

/**
 * @swagger
 * /users/{id}/status:
 *   put:
 *     summary: Actualizar estatus de usuario (solo administradores)
 *     tags: [Users]
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
