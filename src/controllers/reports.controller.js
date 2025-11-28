const ApiResponse = require('../utils/responses');
const ReportsService = require('../services/reports.service');

class ReportsController {
  static async getAttendance(req, res, next) {
    const { fecha, busqueda } = req.query;

    try {
      const registros = await ReportsService.getAttendance(fecha, busqueda);
      return ApiResponse.success(res, registros);
    } catch (error) {
      next(error);
    }
  }

  static async getAttendanceReports(req, res, next) {
    const { fecha, grupo, fechaInicio, fechaFin } = req.query;

    try {
      const reportes = await ReportsService.getAttendanceReports(fecha, grupo, fechaInicio, fechaFin);
      return ApiResponse.success(res, reportes);
    } catch (error) {
      next(error);
    }
  }

  static async getGroups(req, res, next) {
    try {
      const grupos = await ReportsService.getGroups();
      return ApiResponse.success(res, grupos);
    } catch (error) {
      next(error);
    }
}
}

module.exports = ReportsController;
