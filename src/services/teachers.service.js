const TeacherModel = require('../models/Teacher.model');

class TeachersService {
  static async getTeacherById(id) {
    const teacher = await TeacherModel.findById(id);
    return teacher || null;
  }

  static async getTeacherProfile(id) {
    const profile = await TeacherModel.findProfileById(id);
    return profile || null;
  }

  static async getTeacherLists(id, fecha) {
    if (!fecha) throw new Error('Fecha requerida');

    const clases = await TeacherModel.getTeacherClasses(id, fecha);
    const resultados = [];

    for (const clase of clases) {
      const alumnos = await TeacherModel.getClassStudents(
        clase.id_aula, fecha, clase.hora_entrada, clase.hora_salida
      );

      resultados.push({
        aula: clase.nombre_aula,
        edificio: clase.edificio,
        hora_entrada: clase.hora_entrada,
        hora_salida: clase.hora_salida,
        alumnos
      });
    }

    return resultados;
  }
}

module.exports = TeachersService;
