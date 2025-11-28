const TeacherModel = require('../models/Teacher.model');
const logger = require('../utils/logger');

class TeachersService {
  /**
   * Obtener información básica de un profesor por ID
   */
  static async getTeacherById(id) {
    const teacher = await TeacherModel.findById(id);
    if (!teacher) return null;
    
    // Limpiar información sensible si es necesario
    return teacher;
  }

  /**
   * Obtener perfil completo de un profesor
   */
  static async getTeacherProfile(id) {
    const profile = await TeacherModel.findProfileById(id);
    if (!profile) return null;
    
    return profile;
  }

  /**
   * Obtener listas de clases con sus alumnos
   */
  static async getTeacherLists(id, fecha) {
    if (!fecha) {
      logger.warn('Intento de obtener listas sin fecha', { teacherId: id });
      throw new Error('Fecha requerida');
    }

    // Obtener todas las clases del profesor en la fecha indicada
    const clases = await TeacherModel.getTeacherClasses(id, fecha);
    
    if (!clases || clases.length === 0) {
      logger.info('No se encontraron clases para el profesor', { teacherId: id, fecha });
      return [];
    }

    const resultados = [];

    // Para cada clase, obtener la lista de alumnos
    for (const clase of clases) {
      const alumnos = await TeacherModel.getClassStudents(
        clase.id_aula, 
        fecha, 
        clase.hora_entrada, 
        clase.hora_salida
      );

      resultados.push({
        id_aula: clase.id_aula,
        aula: clase.nombre_aula,
        edificio: clase.edificio,
        hora_entrada: clase.hora_entrada,
        hora_salida: clase.hora_salida,
        total_alumnos: alumnos.length,
        alumnos
      });
    }

    logger.info('Listas procesadas exitosamente', { 
      teacherId: id, 
      fecha, 
      totalClases: resultados.length 
    });

    return resultados;
  }
}

module.exports = TeachersService;