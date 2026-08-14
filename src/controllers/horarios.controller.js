const ApiResponse = require('../utils/responses');
const HorariosService = require('../services/horarios.service');

class HorariosController {
  static async getHorarios(req, res, next) {
    try {
      const horarios = await HorariosService.getAllHorarios();
      return ApiResponse.success(res, horarios);
    } catch (error) {
      next(error);
    }
  }

  static async createHorario(req, res, next) {
    try {
      const {
        clave,
        nombre,
        turno,
        hora_inicio,
        hora_fin,
        dias_laborales,
        edificio,
        aula,
        docente,
        alumnos_inscritos,
      } = req.body;
      const result = await HorariosService.createHorario({
        clave,
        nombre,
        turno,
        hora_inicio,
        hora_fin,
        dias_laborales,
        edificio,
        aula,
        docente,
        alumnos_inscritos,
      });
      return ApiResponse.success(res, result.horario, result.message, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateHorario(req, res, next) {
    try {
      const { id } = req.params;
      const {
        clave,
        nombre,
        turno,
        hora_inicio,
        hora_fin,
        dias_laborales,
        edificio,
        aula,
        docente,
        alumnos_inscritos,
      } = req.body;
      const result = await HorariosService.updateHorario(id, {
        clave,
        nombre,
        turno,
        hora_inicio,
        hora_fin,
        dias_laborales,
        edificio,
        aula,
        docente,
        alumnos_inscritos,
      });
      return ApiResponse.success(res, result.horario, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async deleteHorario(req, res, next) {
    try {
      const { id } = req.params;
      const result = await HorariosService.deleteHorario(id);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = HorariosController;
