const HorarioModel = require('../models/Horario.model');
const logger = require('../utils/logger');

const TURNOS_VALIDOS = ['Matutino', 'Vespertino', 'Especial'];

function validarDatos({ clave, nombre, turno, hora_inicio, hora_fin, dias_laborales }) {
  if (!clave || !nombre || !turno || !hora_inicio || !hora_fin) {
    const error = new Error('Datos incompletos');
    error.statusCode = 400;
    throw error;
  }

  if (!TURNOS_VALIDOS.includes(turno)) {
    const error = new Error(`Turno inválido, debe ser uno de: ${TURNOS_VALIDOS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (hora_fin <= hora_inicio) {
    const error = new Error('La hora de fin debe ser posterior a la hora de inicio');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(dias_laborales) || dias_laborales.length === 0) {
    const error = new Error('Debe indicar al menos un día laboral');
    error.statusCode = 400;
    throw error;
  }
}

class HorariosService {
  static async getAllHorarios() {
    try {
      return await HorarioModel.getAllHorarios();
    } catch (error) {
      logger.error('Error obteniendo horarios', { error: error.message });
      throw error;
    }
  }

  static async createHorario(data) {
    validarDatos(data);

    try {
      const horario = await HorarioModel.createHorario(data);
      logger.info('Horario creado', { clave: data.clave });
      return { message: 'Horario creado correctamente', horario };
    } catch (error) {
      logger.error('Error creando horario', { error: error.message });
      throw error;
    }
  }

  static async updateHorario(id, data) {
    validarDatos(data);

    try {
      const horario = await HorarioModel.updateHorario(id, data);
      if (!horario) {
        const error = new Error('Horario no encontrado');
        error.statusCode = 404;
        throw error;
      }
      logger.info('Horario actualizado', { id, clave: data.clave });
      return { message: 'Horario actualizado correctamente', horario };
    } catch (error) {
      logger.error('Error actualizando horario', { error: error.message });
      throw error;
    }
  }

  static async deleteHorario(id) {
    try {
      const eliminado = await HorarioModel.deleteHorario(id);
      if (!eliminado) {
        const error = new Error('Horario no encontrado');
        error.statusCode = 404;
        throw error;
      }
      logger.info('Horario eliminado', { id });
      return { message: 'Horario eliminado correctamente' };
    } catch (error) {
      logger.error('Error eliminando horario', { error: error.message });
      throw error;
    }
  }
}

module.exports = HorariosService;
