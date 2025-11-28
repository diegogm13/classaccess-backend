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
 *   description: Gestión de usuarios del sistema
 */

// ============================================
// 🔓 ENDPOINTS PÚBLICOS
// ============================================

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario (Alumno / Maestro / Admin)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - ap
 *               - correo
 *               - password
 *               - priv
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan"
 *               ap:
 *                 type: string
 *                 example: "Pérez"
 *               am:
 *                 type: string
 *                 example: "García"
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               priv:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: 1=Alumno, 2=Maestro, 3=Administrador
 *                 example: 1
 *               matricula:
 *                 type: string
 *                 description: Requerido si priv=1 (Alumno)
 *                 example: "A12345678"
 *               cod_rfid:
 *                 type: string
 *                 description: Código RFID del alumno (opcional)
 *                 example: "RFID123456"
 *               grupo:
 *                 type: string
 *                 description: Grupo del alumno (opcional)
 *                 example: "3A"
 *               no_empleado:
 *                 type: string
 *                 description: Requerido si priv=2 (Maestro)
 *                 example: "EMP001"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuario registrado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_usu:
 *                       type: integer
 *                       example: 123
 *                     correo:
 *                       type: string
 *                       example: "juan.perez@example.com"
 *                     priv:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error de validación"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       409:
 *         description: El correo ya está registrado
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/register',
  registerValidation,
  sanitizeString('nombre'),
  sanitizeString('ap'),
  sanitizeString('am'),
  sanitizeEmail('correo'),
  sanitizePassword('password'),
  validate,
  usersController.createUser
);

// ============================================
// 🔒 MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// Todos los endpoints después de esta línea requieren autenticación
router.use(authenticate);

// ============================================
// 🔒 ENDPOINTS PROTEGIDOS (ADMIN)
// ============================================

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios agrupados por tipo (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios agrupados por tipo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     alumnos:
 *                       type: array
 *                       items:
 *                         type: object
 *                     maestros:
 *                       type: array
 *                       items:
 *                         type: object
 *                     administradores:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (requiere privilegios de administrador)
 */
router.get('/', authorize(3), usersController.getUsers);

/**
 * @swagger
 * /users/{id}/status:
 *   put:
 *     summary: Actualizar estatus de usuario (activar/desactivar)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estatus
 *             properties:
 *               estatus:
 *                 type: boolean
 *                 description: true=activo, false=inactivo
 *                 example: false
 *     responses:
 *       200:
 *         description: Estatus actualizado correctamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (requiere privilegios de administrador)
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