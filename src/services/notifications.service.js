const ReportModel = require('../models/Report.model');

class ReportsService {
  static async getAttendance(fecha, busqueda) {
    return await ReportModel.getAttendance(fecha, busqueda);
  }

  static async getAttendanceReports(fecha, grupo) {
    // Validar que vengan ambos parámetros
    if (!fecha || !grupo) {
      throw new Error('Se requieren los parámetros fecha y grupo');
    }
    
    return await ReportModel.getAttendanceReports(fecha, grupo);
  }

  static async getGroups() {
    return await ReportModel.getGroups();
  }
}

module.exports = ReportsService;