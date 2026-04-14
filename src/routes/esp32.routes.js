const express = require('express');
const router = express.Router();
const Esp32Controller = require('../controllers/esp32.controller');

/**
 * @swagger
 * tags:
 *   name: ESP32
 *   description: Endpoint publico para microcontrolador ESP32 - control de chapa
 */

/**
 * @swagger
 * /esp32/estado:
 *   get:
 *     summary: Consultar si un aula esta ocupada o disponible (para ESP32)
 *     tags: [ESP32]
 *     description: >
 *       Endpoint publico (sin autenticacion) para que el ESP32 consulte
 *       el estado del aula y decida si abrir o cerrar la chapa en el pin 18.
 *       El campo "abrir_chapa" es true cuando la clase esta activa (abrir),
 *       false cuando esta disponible (mantener cerrada).
 *     parameters:
 *       - in: query
 *         name: aula
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del aula a consultar
 *     responses:
 *       200:
 *         description: Estado del aula
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 id_aula:
 *                   type: integer
 *                   example: 1
 *                 nombre_aula:
 *                   type: string
 *                   example: "Salon A101"
 *                 estado:
 *                   type: string
 *                   enum: [ocupada, disponible]
 *                   example: "ocupada"
 *                 abrir_chapa:
 *                   type: boolean
 *                   description: true = abrir chapa (clase activa), false = mantener cerrada
 *                   example: true
 *       400:
 *         description: Parametro aula invalido
 *       404:
 *         description: Aula no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/estado', Esp32Controller.getEstadoAula);

module.exports = router;
