const ApiResponse = require('../utils/responses');
const PaseListaService = require('../services/paseLista.service');
const { PaseListaError } = require('../services/paseLista.service');
const logger = require('../utils/logger');

/**
 * Traduce los errores de negocio del servicio a respuestas HTTP.
 */
const manejar = (res, next, error, contexto) => {
  if (error instanceof PaseListaError) {
    logger.warn('Pase de lista: solicitud rechazada', {
      mensaje: error.message,
      ...contexto,
    });
    return ApiResponse.error(res, error.message, error.statusCode);
  }
  logger.error('Error en pase de lista', {
    error: error.message,
    stack: error.stack,
    ...contexto,
  });
  return next(error);
};

class PaseListaController {
  /**
   * GET /pase-lista/catalogos - Grupos disponibles para armar una hoja
   */
  static async getCatalogos(req, res, next) {
    try {
      const catalogos = await PaseListaService.getCatalogos();
      return ApiResponse.success(res, catalogos);
    } catch (error) {
      return manejar(res, next, error, { ruta: 'catalogos' });
    }
  }

  /**
   * GET /pase-lista/hojas - Hojas registradas por el docente autenticado
   */
  static async listarHojas(req, res, next) {
    try {
      const hojas = await PaseListaService.listarHojas(req.user.id);
      return ApiResponse.success(res, hojas);
    } catch (error) {
      return manejar(res, next, error, { ruta: 'hojas', idDocente: req.user.id });
    }
  }

  /**
   * GET /pase-lista/hoja?grupo=&asignatura=&mes=&anio=
   * Hoja completa (encabezado + alumnos + marcas). Si no existe la hoja,
   * devuelve el grupo en blanco para empezar a llenarla.
   */
  static async getHoja(req, res, next) {
    try {
      const { grupo, asignatura, mes, anio } = req.query;

      const datos = await PaseListaService.getHoja({
        idDocente: req.user.id,
        asignatura: asignatura || null,
        grupo,
        mes: Number(mes),
        anio: Number(anio),
      });

      return ApiResponse.success(res, datos);
    } catch (error) {
      return manejar(res, next, error, { ruta: 'hoja', query: req.query });
    }
  }

  /**
   * POST /pase-lista - Crear o actualizar el encabezado de la hoja
   */
  static async guardarHoja(req, res, next) {
    try {
      const datos = await PaseListaService.guardarHoja({
        ...req.body,
        id_docente: req.user.id,
      });
      return ApiResponse.success(res, datos, 'Hoja guardada');
    } catch (error) {
      return manejar(res, next, error, { ruta: 'guardarHoja', idDocente: req.user.id });
    }
  }

  /**
   * PUT /pase-lista/:id/marcas - Guardar las marcas de asistencia
   */
  static async guardarMarcas(req, res, next) {
    try {
      const marcas = await PaseListaService.guardarMarcas(
        parseInt(req.params.id, 10),
        req.user.id,
        req.user.priv_usu,
        req.body.marcas
      );
      return ApiResponse.success(res, marcas, 'Pase de lista registrado');
    } catch (error) {
      return manejar(res, next, error, { ruta: 'guardarMarcas', idPase: req.params.id });
    }
  }

  /**
   * PATCH /pase-lista/:id/observaciones
   */
  static async actualizarObservaciones(req, res, next) {
    try {
      const hoja = await PaseListaService.actualizarObservaciones(
        parseInt(req.params.id, 10),
        req.user.id,
        req.user.priv_usu,
        req.body.observaciones
      );
      return ApiResponse.success(res, hoja, 'Observaciones actualizadas');
    } catch (error) {
      return manejar(res, next, error, { ruta: 'observaciones', idPase: req.params.id });
    }
  }

  /**
   * DELETE /pase-lista/:id
   */
  static async eliminarHoja(req, res, next) {
    try {
      await PaseListaService.eliminarHoja(
        parseInt(req.params.id, 10),
        req.user.id,
        req.user.priv_usu
      );
      return ApiResponse.success(res, null, 'Hoja eliminada');
    } catch (error) {
      return manejar(res, next, error, { ruta: 'eliminarHoja', idPase: req.params.id });
    }
  }
}

module.exports = PaseListaController;
