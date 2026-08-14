const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const reportesAsistenciaController = require('../controllers/reportesAsistencia.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/sanitization');

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
  query('desde').optional().custom((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v)).withMessage('desde debe tener formato YYYY-MM-DD'),
  query('hasta').optional().custom((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v)).withMessage('hasta debe tener formato YYYY-MM-DD'),
  validate,
  reportesAsistenciaController.getTabla
);

module.exports = router;
