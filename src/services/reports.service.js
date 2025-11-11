// services/reports.service.js
const ReportModel = require('../models/Report.model');

class ReportsService {
  static async getAttendance(fecha, busqueda) {
    return await ReportModel.getAttendance(fecha, busqueda);
  }

  static async getAttendanceReports(fecha, grupo, fechaInicio, fechaFin) {
    return await ReportModel.getAttendanceReports(fecha, grupo, fechaInicio, fechaFin);
  }

  static async getGroups() {
    return await ReportModel.getGroups();
  }
}

module.exports = ReportsService;
