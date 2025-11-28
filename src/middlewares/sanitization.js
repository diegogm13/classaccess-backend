// middlewares/sanitization.js
const { body, param, query, validationResult } = require('express-validator');

// Sanitiza y valida campos de tipo string
const sanitizeString = (field, min = 1, max = 255) =>
  body(field)
    .trim()
    .escape()
    .isLength({ min, max })
    .withMessage(`${field} debe tener entre ${min} y ${max} caracteres`);

// Sanitiza y valida campos de tipo número entero
const sanitizeNumber = (field) =>
  body(field)
    .toInt()
    .isInt()
    .withMessage(`${field} debe ser un número entero`);

// Sanitiza y valida emails
const sanitizeEmail = (field) =>
  body(field)
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage(`${field} debe ser un email válido`);

// Sanitiza y valida contraseñas
const sanitizePassword = (field, min = 6, max = 100) =>
  body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} debe tener entre ${min} y ${max} caracteres`);

// Sanitiza y valida campos booleanos
const sanitizeBoolean = (field) =>
  body(field)
    .toBoolean()
    .isBoolean()
    .withMessage(`${field} debe ser true o false`);

// **Agregado específicamente para la API de dispositivos**
const sanitizeDeviceFields = [
  sanitizeString('nombre_dispositivo', 1, 255),
  sanitizeString('descripcion', 0, 255),
  sanitizeBoolean('estatus'),
];

// Sanitiza y valida fechas en el body
const sanitizeDate = (field) =>
  body(field)
    .isISO8601()
    .toDate()
    .withMessage(`${field} debe ser una fecha válida (YYYY-MM-DD)`);

// Sanitiza fechas en query params (SIN escape)
const sanitizeDateQuery = (field) =>
  query(field)
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage(`${field} debe tener formato YYYY-MM-DD`)
    .isISO8601()
    .withMessage(`${field} debe ser una fecha válida`);

// Sanitiza parámetros de ruta
const sanitizeParamId = (field) =>
  param(field)
    .toInt()
    .isInt({ gt: 0 })
    .withMessage(`${field} debe ser un número entero positivo`);

// Sanitiza parámetros de query genéricos
const sanitizeQuery = (field) =>
  query(field)
    .trim()
    .escape();

const sanitizeQueryNoEscape = (field) =>
  query(field)
    .trim();

// Middleware que verifica errores de validación y sanitización
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Error de validación',
      errors: errors.array() 
    });
  }
  next();
};

module.exports = {
  sanitizeString,
  sanitizeNumber,
  sanitizeEmail,
  sanitizePassword,
  sanitizeBoolean,
  sanitizeDate,
  sanitizeDateQuery,
  sanitizeParamId,
  sanitizeQuery,
  sanitizeQueryNoEscape,
  sanitizeDeviceFields, // ✅ agregado
  validate
};
