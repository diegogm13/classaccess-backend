// middlewares/sanitization.js
const { body, param, query, validationResult } = require('express-validator');

/**
 * Sanitiza y valida campos de tipo string
 * @param {string} field - Nombre del campo
 * @param {number} min - Longitud mínima
 * @param {number} max - Longitud máxima
 */
const sanitizeString = (field, min = 1, max = 255) =>
  body(field)
    .trim()
    .escape()
    .isLength({ min, max })
    .withMessage(`${field} debe tener entre ${min} y ${max} caracteres`);

/**
 * Sanitiza y valida campos de tipo número entero
 * @param {string} field - Nombre del campo
 */
const sanitizeNumber = (field) =>
  body(field)
    .toInt()
    .isInt()
    .withMessage(`${field} debe ser un número entero`);

/**
 * Sanitiza y valida emails
 * @param {string} field - Nombre del campo
 */
const sanitizeEmail = (field) =>
  body(field)
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage(`${field} debe ser un email válido`);

/**
 * Sanitiza y valida contraseñas
 * @param {string} field - Nombre del campo
 * @param {number} min - Longitud mínima
 * @param {number} max - Longitud máxima
 */
const sanitizePassword = (field, min = 6, max = 100) =>
  body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} debe tener entre ${min} y ${max} caracteres`);

/**
 * Sanitiza y valida campos booleanos
 * @param {string} field - Nombre del campo
 */
const sanitizeBoolean = (field) =>
  body(field)
    .toBoolean()
    .isBoolean()
    .withMessage(`${field} debe ser true o false`);

/**
 * Sanitiza y valida fechas
 * @param {string} field - Nombre del campo
 */
const sanitizeDate = (field) =>
  body(field)
    .isISO8601()
    .toDate()
    .withMessage(`${field} debe ser una fecha válida (YYYY-MM-DD)`);

/**
 * Sanitiza parámetros de ruta (por ejemplo :id)
 * @param {string} field - Nombre del parámetro
 */
const sanitizeParamId = (field) =>
  param(field)
    .toInt()
    .isInt({ gt: 0 })
    .withMessage(`${field} debe ser un número entero positivo`);

/**
 * Sanitiza parámetros de query
 * @param {string} field - Nombre del parámetro
 */
const sanitizeQuery = (field) =>
  query(field)
    .trim()
    .escape();

/**
 * Middleware que verifica errores de validación y sanitización
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  sanitizeString,
  sanitizeNumber,
  sanitizeEmail,
  sanitizePassword, // ✅ agregado
  sanitizeBoolean,
  sanitizeDate,
  sanitizeParamId,
  sanitizeQuery,
  validate
};
