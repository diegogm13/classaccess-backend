const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const horariosController = require('../controllers/horarios.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { idValidation } = require('../middlewares/validation');
const { sanitizeString, sanitizeNumber, validate } = require('../middlewares/sanitization');

router.use(authenticate);
router.use(authorize(3)); // Solo administradores

const horarioBodyValidation = [
  sanitizeString('clave', 1, 20),
  sanitizeString('nombre', 1, 150),
  body('turno').trim().isIn(['Matutino', 'Vespertino', 'Especial']).withMessage('Turno inválido'),
  body('hora_inicio').matches(/^\d{2}:\d{2}$/).withMessage('hora_inicio debe tener formato HH:MM'),
  body('hora_fin').matches(/^\d{2}:\d{2}$/).withMessage('hora_fin debe tener formato HH:MM'),
  body('dias_laborales').isArray({ min: 1 }).withMessage('Debe indicar al menos un día laboral'),
  body('edificio').optional({ checkFalsy: true }).trim().escape().isLength({ max: 100 }),
  body('aula').optional({ checkFalsy: true }).trim().escape().isLength({ max: 100 }),
  body('docente').optional({ checkFalsy: true }).trim().escape().isLength({ max: 150 }),
  sanitizeNumber('alumnos_inscritos'),
];

/**
 * @swagger
 * tags:
 *   name: Horarios
 *   description: Gestión de grupos, turnos y horarios (Control de Horarios)
 */

router.get('/', horariosController.getHorarios);

router.post('/', horarioBodyValidation, validate, horariosController.createHorario);

router.put('/:id', idValidation, horarioBodyValidation, validate, horariosController.updateHorario);

router.delete('/:id', idValidation, horariosController.deleteHorario);

module.exports = router;
