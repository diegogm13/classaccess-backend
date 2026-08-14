const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const reportesAsistenciaController = require('../controllers/reportesAsistencia.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/sanitization');

const fechaQuery = (campo) =>
  query(campo)
    .optional()
    .custom((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v))
    .withMessage(`${campo} debe tener formato YYYY-MM-DD`);

router.use(authenticate);
router.use(authorize(3)); // Solo administradores (sección "Reportes de Asistencia" del admin)

/**
 * @swagger
 * tags:
 *   name: ReportesAsistencia
 *   description: Analítica de asistencia (puntualidad, retardos, faltas)
 */

router.get('/resumen', reportesAsistenciaController.getResumen);

router.get('/distribucion', reportesAsistenciaController.getDistribucion);

router.get(
  '/tendencia',
  query('dias').optional().isInt({ min: 1, max: 90 }).withMessage('dias debe ser un entero entre 1 y 90'),
  validate,
  reportesAsistenciaController.getTendencia
);

router.get(
  '/tabla',
  fechaQuery('desde'),
  fechaQuery('hasta'),
  query('grupo').optional().trim().escape().isLength({ max: 20 }),
  query('turno').optional().trim().isIn(['Matutino', 'Vespertino', 'Especial']),
  validate,
  reportesAsistenciaController.getTabla
);

router.get(
  '/bitacora/:idUsu',
  param('idUsu').isInt({ gt: 0 }).withMessage('idUsu debe ser un número entero positivo'),
  fechaQuery('desde'),
  fechaQuery('hasta'),
  validate,
  reportesAsistenciaController.getBitacora
);

module.exports = router;
