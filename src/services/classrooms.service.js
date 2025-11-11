const ClassroomModel = require('../models/Classroom.model');
const logger = require('../utils/logger');

class ClassroomsService {
  static async getAllClassrooms() {
    try {
      const classrooms = await ClassroomModel.getAllClassrooms();
      return classrooms;
    } catch (error) {
      logger.error('Error obteniendo aulas', { error: error.message });
      throw error;
    }
  }

  static async createClassroom({ nombre_aula, edificio, id_dispositivo }) {
    if (!nombre_aula || !edificio || !id_dispositivo) {
      const error = new Error('Datos incompletos');
      error.statusCode = 400;
      throw error;
    }

    try {
      await ClassroomModel.createClassroom(nombre_aula, edificio, id_dispositivo);
      logger.info('Aula creada', { nombre_aula, edificio, id_dispositivo });
      return { message: 'Aula agregada correctamente' };
    } catch (error) {
      logger.error('Error creando aula', { error: error.message });
      throw error;
    }
  }

  static async updateClassroom(id, { nombre_aula, edificio, id_dispositivo }) {
    if (!nombre_aula || !edificio) {
      const error = new Error('Datos incompletos');
      error.statusCode = 400;
      throw error;
    }

    try {
      await ClassroomModel.updateClassroom(id, nombre_aula, edificio, id_dispositivo);
      logger.info('Aula actualizada', { aulaId: id, nombre_aula, id_dispositivo });
      return { message: 'Aula actualizada correctamente' };
    } catch (error) {
      logger.error('Error actualizando aula', { error: error.message });
      throw error;
    }
  }
}

module.exports = ClassroomsService;
