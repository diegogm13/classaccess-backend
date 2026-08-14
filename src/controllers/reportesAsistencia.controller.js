const ApiResponse = require('../utils/responses');
const ReportesAsistenciaService = require('../services/reportesAsistencia.service');

class ReportesAsistenciaController {
  static async getResumen(req, res, next) {
    try {
      const resumen = await ReportesAsistenciaService.getResumen();
      return ApiResponse.success(res, resumen);
    } catch (error) {
      next(error);
    }
  }

  static async getDistribucion(req, res, next) {
    try {
      const distribucion = await ReportesAsistenciaService.getDistribucion();
      return ApiResponse.success(res, distribucion);
    } catch (error) {
      next(error);
    }
  }

  static async getTendencia(req, res, next) {
    try {
      const { dias } = req.query;
      const tendencia = await ReportesAsistenciaService.getTendencia(dias);
      return ApiResponse.success(res, tendencia);
    } catch (error) {
      next(error);
    }
  }

  static async getTabla(req, res, next) {
    try {
      const { desde, hasta, grupo, turno } = req.query;
      const tabla = await ReportesAsistenciaService.getTabla(desde, hasta, grupo, turno);
      return ApiResponse.success(res, tabla);
    } catch (error) {
      next(error);
    }
  }

  static async getBitacora(req, res, next) {
    try {
      const { idUsu } = req.params;
      const { desde, hasta } = req.query;
      const bitacora = await ReportesAsistenciaService.getBitacora(idUsu, desde, hasta);
      return ApiResponse.success(res, bitacora);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportesAsistenciaController;
