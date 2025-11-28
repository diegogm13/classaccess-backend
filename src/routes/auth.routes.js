const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginValidation } = require('../middlewares/validation');
const { loginLimiter } = require('../middlewares/rateLimit');
const { sanitizeString, validate } = require('../middlewares/sanitization');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Operaciones de autenticación
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login exitoso
 */
router.post(
  '/login',
  loginLimiter,
  loginValidation,
  sanitizeString('correo'),
  sanitizeString('password'),
  validate,
  authController.login
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout de usuario
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout exitoso
 */
router.post(
  '/logout',
  authController.logout
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 */
router.post(
  '/refresh',
  authController.refreshAccessToken
);

module.exports = router;