class ApiResponse {
  static success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'Error en la operación', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  static unauthorized(res, message = 'No autorizado') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'Acceso prohibido') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static notFound(res, message = 'Recurso no encontrado') {
    return res.status(404).json({
      success: false,
      message
    });
  }
}

module.exports = ApiResponse;