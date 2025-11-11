const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/responses');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 'Error de validación', 400, errors.array());
  }
  next();
};

const loginValidation = [
  body('correo').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Password requerido'),
  validate
];

const registerValidation = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('ap').trim().notEmpty().withMessage('Apellido paterno requerido'),
  body('am').trim().notEmpty().withMessage('Apellido materno requerido'),
  body('correo').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password debe tener mínimo 6 caracteres'),
  body('priv').isInt({ min: 1, max: 3 }).withMessage('Privilegio inválido'),
  validate
];

const idValidation = [
  param('id').isInt().withMessage('ID debe ser un número entero'),
  validate
];

module.exports = {
  validate,
  loginValidation,
  registerValidation,
  idValidation
};