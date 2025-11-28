// controllers/students.controller.js
const ApiResponse = require('../utils/responses');
const StudentsService = require('../services/students.service');
const logger = require('../utils/logger');

class StudentsController {
  /**
   * GET /students/:id - Obtener información de un alumno
   */
  static async getStudent(req, res, next) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterPriv = req.user.priv_usu;

      // 🔒 Alumno solo puede ver su propio perfil
      if (requesterPriv === 1 && requesterId !== parseInt(id)) {
        logger.warn('Alumno intentó acceder a perfil de otro usuario', {
          requesterId,
          targetId: id
        });
        return ApiResponse.error(res, 'No tienes permiso para ver este perfil', 403);
      }

      // 📋 Obtener datos del estudiante
      const student = await StudentsService.getStudentById(id);
      
      if (!student) {
        logger.warn('Alumno no encontrado', { id });
        return ApiResponse.notFound(res, 'Alumno no encontrado');
      }

      logger.info('Perfil de alumno obtenido', { 
        studentId: id, 
        requesterId 
      });

      return ApiResponse.success(res, student);

    } catch (error) {
      logger.error('Error al obtener alumno', { 
        error: error.message,
        id: req.params.id 
      });
      next(error);
    }
  }

  /**
   * GET /students/:id/history - Obtener historial de asistencia
   */
  static async getStudentHistory(req, res, next) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterPriv = req.user.priv_usu;

      // 🔒 Alumno solo puede ver su propio historial
      if (requesterPriv === 1 && requesterId !== parseInt(id)) {
        logger.warn('Alumno intentó acceder a historial de otro usuario', {
          requesterId,
          targetId: id
        });
        return ApiResponse.error(res, 'No tienes permiso para ver este historial', 403);
      }

      // 📋 Obtener historial
      const history = await StudentsService.getStudentHistory(id);

      logger.info('Historial de alumno obtenido', { 
        studentId: id, 
        requesterId,
        recordsCount: history.length 
      });

      return ApiResponse.success(res, history);

    } catch (error) {
      logger.error('Error al obtener historial de alumno', { 
        error: error.message,
        id: req.params.id 
      });
      next(error);
    }
  }

  /**
   * PUT /students/:id - Actualizar información de un alumno
   */
  static async updateStudent(req, res, next) {
    try {
      const { id } = req.params;
      const requesterId = req.user.id;
      const requesterPriv = req.user.priv_usu;

      // 🔒 Alumno solo puede editar su propio perfil
      if (requesterPriv === 1 && requesterId !== parseInt(id)) {
        logger.warn('Alumno intentó editar perfil de otro usuario', {
          requesterId,
          targetId: id
        });
        return ApiResponse.error(res, 'No puedes actualizar este perfil', 403);
      }

      // 📝 Validar que el alumno exista
      const studentExists = await StudentsService.getStudentById(id);
      if (!studentExists) {
        logger.warn('Intento de actualizar alumno inexistente', { id });
        return ApiResponse.notFound(res, 'Alumno no encontrado');
      }

      // ✏️ Actualizar datos
      const { nombre_usu, ap_usu, am_usu, correo_usu, matricula, cod_rfid, grupo } = req.body;

      await StudentsService.updateStudent(id, {
        nombre: nombre_usu,
        ap: ap_usu,
        am: am_usu,
        correo: correo_usu,
        matricula,
        cod_rfid,
        grupo
      });

      logger.info('Perfil de alumno actualizado', { 
        studentId: id, 
        updatedBy: requesterId 
      });

      return ApiResponse.success(res, null, 'Perfil actualizado correctamente');

    } catch (error) {
      logger.error('Error al actualizar alumno', { 
        error: error.message,
        id: req.params.id 
      });
      next(error);
    }
  }
}

module.exports = StudentsController;