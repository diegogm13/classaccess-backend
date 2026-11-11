const PaseListaModel = require('../models/PaseLista.model');
const { CLAVES_VALIDAS } = require('../models/PaseLista.model');
const logger = require('../utils/logger');

/**
 * Error de negocio con codigo HTTP, para que el controlador no tenga que
 * adivinar si fue 400, 403 o 404.
 */
class PaseListaError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'PaseListaError';
    this.statusCode = statusCode;
  }
}

const diasDelMes = (mes, anio) => new Date(anio, mes, 0).getDate();

class PaseListaService {
  /**
   * Catalogo de grupos con alumnos para armar la hoja.
   */
  static async getCatalogos() {
    const grupos = await PaseListaModel.getGrupos();
    return { grupos };
  }

  /**
   * Hojas registradas por el docente.
   */
  static async listarHojas(idDocente) {
    return PaseListaModel.listarHojas(idDocente);
  }

  /**
   * Hoja completa: encabezado + alumnos del grupo + marcas.
   * Si todavia no existe la hoja, devuelve el grupo en blanco para llenarla.
   */
  static async getHoja({ idDocente, asignatura, grupo, mes, anio }) {
    if (!grupo) throw new PaseListaError('El grupo es requerido');
    if (!mes || !anio) throw new PaseListaError('Mes y anio son requeridos');

    const alumnos = await PaseListaModel.getAlumnosPorGrupo(grupo);
    if (alumnos.length === 0) {
      throw new PaseListaError(`El grupo "${grupo}" no tiene alumnos inscritos`, 404);
    }

    let hoja = null;
    let marcas = [];

    if (asignatura) {
      hoja = await PaseListaModel.findHoja(idDocente, asignatura, grupo, mes, anio);
      if (hoja) marcas = await PaseListaModel.getMarcas(hoja.id_pase);
    }

    return {
      hoja,
      grupo,
      mes,
      anio,
      dias: diasDelMes(mes, anio),
      claves: CLAVES_VALIDAS,
      alumnos,
      marcas,
    };
  }

  /**
   * Crear o actualizar el encabezado y devolver la hoja completa.
   */
  static async guardarHoja(datos) {
    const { id_docente, asignatura, grupo, mes, anio } = datos;

    if (!asignatura || !String(asignatura).trim()) {
      throw new PaseListaError('La asignatura es requerida');
    }
    if (!grupo) throw new PaseListaError('El grupo es requerido');

    const mesNum = Number(mes);
    const anioNum = Number(anio);
    if (!Number.isInteger(mesNum) || mesNum < 1 || mesNum > 12) {
      throw new PaseListaError('Mes invalido (1-12)');
    }
    if (!Number.isInteger(anioNum) || anioNum < 2000 || anioNum > 2100) {
      throw new PaseListaError('Anio invalido (2000-2100)');
    }

    const alumnos = await PaseListaModel.getAlumnosPorGrupo(grupo);
    if (alumnos.length === 0) {
      throw new PaseListaError(`El grupo "${grupo}" no tiene alumnos inscritos`, 404);
    }

    const hoja = await PaseListaModel.upsertHoja({
      ...datos,
      id_docente,
      asignatura: String(asignatura).trim(),
      mes: mesNum,
      anio: anioNum,
    });

    logger.info('Hoja de pase de lista guardada', {
      idPase: hoja.id_pase,
      idDocente: id_docente,
      grupo,
      mes: mesNum,
      anio: anioNum,
    });

    const marcas = await PaseListaModel.getMarcas(hoja.id_pase);

    return {
      hoja,
      grupo,
      mes: mesNum,
      anio: anioNum,
      dias: diasDelMes(mesNum, anioNum),
      claves: CLAVES_VALIDAS,
      alumnos,
      marcas,
    };
  }

  /**
   * Validar que la hoja exista y pertenezca al docente que la pide.
   */
  static async getHojaPropia(idPase, idDocente, privilegio) {
    const hoja = await PaseListaModel.findHojaById(idPase);
    if (!hoja) throw new PaseListaError('Hoja de pase de lista no encontrada', 404);

    // El administrador (priv 3) puede consultar cualquier hoja; el docente solo la suya.
    if (privilegio !== 3 && hoja.id_docente !== idDocente) {
      throw new PaseListaError('No tienes permiso sobre esta hoja', 403);
    }
    return hoja;
  }

  /**
   * Guardar las marcas de asistencia de la hoja.
   */
  static async guardarMarcas(idPase, idDocente, privilegio, marcas) {
    const hoja = await this.getHojaPropia(idPase, idDocente, privilegio);

    if (!Array.isArray(marcas)) {
      throw new PaseListaError('El cuerpo debe incluir un arreglo "marcas"');
    }

    const maxDia = diasDelMes(hoja.mes, hoja.anio);
    const alumnos = await PaseListaModel.getAlumnosPorGrupo(hoja.grupo);
    const idsValidos = new Set(alumnos.map((a) => a.id_alumno));

    const limpias = [];
    const vistas = new Set();

    for (const marca of marcas) {
      const idAlumno = Number(marca.id_alumno);
      const dia = Number(marca.dia);
      const clave = String(marca.clave || '').toUpperCase();

      if (!idsValidos.has(idAlumno)) {
        throw new PaseListaError(`El alumno ${idAlumno} no pertenece al grupo ${hoja.grupo}`);
      }
      if (!Number.isInteger(dia) || dia < 1 || dia > maxDia) {
        throw new PaseListaError(`Dia invalido (${marca.dia}) para ${hoja.mes}/${hoja.anio}`);
      }
      if (!CLAVES_VALIDAS.includes(clave)) {
        throw new PaseListaError(`Clave invalida "${marca.clave}". Use ${CLAVES_VALIDAS.join(', ')}`);
      }

      const llave = `${idAlumno}-${dia}`;
      if (vistas.has(llave)) continue; // la ultima gana, se ignora el duplicado previo
      vistas.add(llave);

      limpias.push({ id_alumno: idAlumno, dia, clave });
    }

    const guardadas = await PaseListaModel.guardarMarcas(idPase, limpias);

    logger.info('Marcas de pase de lista guardadas', {
      idPase,
      idDocente,
      total: guardadas.length,
    });

    return guardadas;
  }

  static async actualizarObservaciones(idPase, idDocente, privilegio, observaciones) {
    await this.getHojaPropia(idPase, idDocente, privilegio);
    return PaseListaModel.actualizarObservaciones(idPase, observaciones);
  }

  static async eliminarHoja(idPase, idDocente, privilegio) {
    await this.getHojaPropia(idPase, idDocente, privilegio);
    const eliminada = await PaseListaModel.eliminarHoja(idPase);
    logger.info('Hoja de pase de lista eliminada', { idPase, idDocente });
    return eliminada;
  }
}

module.exports = PaseListaService;
module.exports.PaseListaError = PaseListaError;
module.exports.diasDelMes = diasDelMes;
