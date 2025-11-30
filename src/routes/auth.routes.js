const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginValidation } = require('../middlewares/validation');
const { loginLimiter } = require('../middlewares/rateLimit');
const { sanitizeString, validate } = require('../middlewares/sanitization');

router.post(
  '/login',
  loginLimiter,
  loginValidation,
  sanitizeString('correo'),
  sanitizeString('password'),
  validate,
  authController.login
);

router.post('/logout', authController.logout);

router.post('/refresh', authController.refreshAccessToken);

module.exports = router;
