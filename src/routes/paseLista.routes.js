const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const paseListaController = require('../controllers/paseLista.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { sanitizeParamId, validate } = require('../middlewares/sanitization');

// 🔒 Todos los endpoints requieren autenticación por cookie
router.use(authenticate);

// Docentes (2) y administradores (3). El servicio valida además la propiedad
// de la hoja: un docente solo toca las suyas.
const soloDocenteOAdmin = authorize(2, 3);

// Los campos de texto van con trim y límite de longitud, pero SIN .escape():
// el nombre de la asignatura se guarda tal cual lo escribe el docente y se
// imprime en el PDF. La protección contra inyección viene de las consultas
// parametrizadas del modelo.
const textoOpcional = (campo, max) =>
  body(campo).optional({ nullable: true }).trim().isLength({ max })
    .withMessage(`${campo} admite máximo ${max} caracteres`);

/**
 * @swagger
 * tags:
 *   name: PaseLista
 *   description: Hojas de pase de lista (formato EA-F-11)
 */

/**
 * @swagger
 * /pase-lista/catalogos:
 *   get:
 *     summary: Grupos disponibles para armar una hoja de pase de lista
 *     tags: [PaseLista]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Listado de grupos con su total de alumnos
 */
router.get('/catalogos', soloDocenteOAdmin, paseListaController.getCatalogos);

/**
 * @swagger
 * /pase-lista/hojas:
 *   get:
 *     summary: Hojas de pase de lista registradas por el docente autenticado
 *     tags: [PaseLista]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Listado de hojas
 */
router.get('/hojas', soloDocenteOAdmin, paseListaController.listarHojas);

/**
 * @swagger
 * /pase-lista/hoja:
 *   get:
 *     summary: Hoja completa (encabezado, alumnos del grupo y marcas)
 *     description: >
 *       Si todavía no existe la hoja para ese docente/asignatura/grupo/mes/año,
 *       devuelve el grupo en blanco para empezar a llenarla.
 *     tags: [PaseLista]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: grupo
 *         required: true
 *         schema: { type: string, example: "IDGS16" }
 *       - in: query
 *         name: mes
 *         required: true
 *         schema: { type: integer, example: 11 }
 *       - in: query
 *         name: anio
 *         required: true
 *         schema: { type: integer, example: 2026 }
 *       - in: query
 *         name: asignatura
 *         schema: { type: string, example: "Programación Web" }
 *     responses:
 *       200:
 *         description: Hoja con alumnos y marcas
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: El grupo no tiene alumnos inscritos
 */
router.get(
  '/hoja',
  soloDocenteOAdmin,
  query('grupo').trim().notEmpty().withMessage('grupo es requerido').isLength({ max: 20 }),
  query('mes').toInt().isInt({ min: 1, max: 12 }).withMessage('mes debe estar entre 1 y 12'),
  query('anio').toInt().isInt({ min: 2000, max: 2100 }).withMessage('anio debe estar entre 2000 y 2100'),
  query('asignatura').optional({ nullable: true }).trim().isLength({ max: 150 }),
  validate,
  paseListaController.getHoja
);

/**
 * @swagger
 * /pase-lista:
 *   post:
 *     summary: Crear o actualizar el encabezado de una hoja de pase de lista
 *     tags: [PaseLista]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [asignatura, grupo, mes, anio]
 *             properties:
 *               programa_educativo: { type: string }
 *               periodo:            { type: string, example: "enero-abril 2026" }
 *               asignatura:         { type: string }
 *               grupo:              { type: string }
 *               turno:              { type: string, example: "Matutino" }
 *               mes:                { type: integer }
 *               anio:               { type: integer }
 *               observaciones:      { type: string }
 *     responses:
 *       200:
 *         description: Hoja guardada con alumnos y marcas
 *       400:
 *         description: Datos inválidos
 */
router.post(
  '/',
  soloDocenteOAdmin,
  body('asignatura').trim().notEmpty().withMessage('asignatura es requerida').isLength({ max: 150 }),
  body('grupo').trim().notEmpty().withMessage('grupo es requerido').isLength({ max: 20 }),
  body('mes').toInt().isInt({ min: 1, max: 12 }).withMessage('mes debe estar entre 1 y 12'),
  body('anio').toInt().isInt({ min: 2000, max: 2100 }).withMessage('anio debe estar entre 2000 y 2100'),
  textoOpcional('programa_educativo', 150),
  textoOpcional('periodo', 60),
  textoOpcional('turno', 20),
  textoOpcional('observaciones', 2000),
  validate,
  paseListaController.guardarHoja
);

/**
 * @swagger
 * /pase-lista/{id}/marcas:
 *   put:
 *     summary: Registrar las marcas de asistencia de la hoja
 *     description: >
 *       Reemplaza el conjunto de marcas de la hoja por el recibido. Las celdas
 *       que el docente dejó vacías se eliminan. Claves válidas: A (asistencia),
 *       F (falta), R (retardo), J (falta justificada).
 *     tags: [PaseLista]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [marcas]
 *             properties:
 *               marcas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_alumno: { type: integer }
 *                     dia:       { type: integer, example: 14 }
 *                     clave:     { type: string, enum: [A, F, R, J] }
 *     responses:
 *       200:
 *         description: Marcas registradas
 *       400:
 *         description: Marcas inválidas
 *       403:
 *         description: La hoja es de otro docente
 *       404:
 *         description: Hoja no encontrada
 */
router.put(
  '/:id/marcas',
  soloDocenteOAdmin,
  sanitizeParamId('id'),
  body('marcas').isArray({ max: 2000 }).withMessage('marcas debe ser un arreglo'),
  validate,
  paseListaController.guardarMarcas
);

/**
 * @swagger
 * /pase-lista/{id}/observaciones:
 *   patch:
 *     summary: Actualizar las observaciones de la hoja
 *     tags: [PaseLista]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Observaciones actualizadas
 */
router.patch(
  '/:id/observaciones',
  soloDocenteOAdmin,
  sanitizeParamId('id'),
  textoOpcional('observaciones', 2000),
  validate,
  paseListaController.actualizarObservaciones
);

/**
 * @swagger
 * /pase-lista/{id}:
 *   delete:
 *     summary: Eliminar una hoja de pase de lista y sus marcas
 *     tags: [PaseLista]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Hoja eliminada
 *       403:
 *         description: La hoja es de otro docente
 *       404:
 *         description: Hoja no encontrada
 */
router.delete(
  '/:id',
  soloDocenteOAdmin,
  sanitizeParamId('id'),
  validate,
  paseListaController.eliminarHoja
);

module.exports = router;
