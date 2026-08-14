const ReportesAsistenciaModel = require('../models/ReportesAsistencia.model');
const logger = require('../utils/logger');

const META_CUMPLIMIENTO_PCT = 85;

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

// Lunes de la semana de `date` (semana empieza en lunes).
function lunesDeLaSemana(date) {
  const dia = date.getUTCDay(); // 0 = domingo
  const offset = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(date);
  lunes.setUTCDate(date.getUTCDate() + offset);
  return lunes;
}

function restarDias(date, dias) {
  const copia = new Date(date);
  copia.setUTCDate(copia.getUTCDate() - dias);
  return copia;
}

// Periodo actual: lunes de esta semana -> hoy. Periodo anterior: mismo rango,
// una semana antes (para comparar "manzanas con manzanas").
function periodosComparables() {
  const hoy = new Date(new Date().toISOString().slice(0, 10)); // sin hora, UTC
  const inicioActual = lunesDeLaSemana(hoy);

  return {
    actual: { desde: toISODate(inicioActual), hasta: toISODate(hoy) },
    anterior: {
      desde: toISODate(restarDias(inicioActual, 7)),
      hasta: toISODate(restarDias(hoy, 7)),
    },
  };
}

function calcularCumplimientoPct({ a_tiempo, retardo }) {
  const total = a_tiempo + retardo;
  if (total === 0) return 0;
  return Math.round((a_tiempo / total) * 1000) / 10;
}

class ReportesAsistenciaService {
  static async getResumen() {
    try {
      const { actual, anterior } = periodosComparables();

      const [
        alumnosActuales,
        alumnosAnteriores,
        aTiempoRetardoActual,
        aTiempoRetardoAnterior,
        faltasActuales,
        faltasAnteriores,
      ] = await Promise.all([
        ReportesAsistenciaModel.contarAlumnosActivos(actual.desde, actual.hasta),
        ReportesAsistenciaModel.contarAlumnosActivos(anterior.desde, anterior.hasta),
        ReportesAsistenciaModel.contarATiempoYRetardos(actual.desde, actual.hasta),
        ReportesAsistenciaModel.contarATiempoYRetardos(anterior.desde, anterior.hasta),
        ReportesAsistenciaModel.contarFaltas(actual.desde, actual.hasta),
        ReportesAsistenciaModel.contarFaltas(anterior.desde, anterior.hasta),
      ]);

      return {
        alumnos_activos: alumnosActuales,
        alumnos_activos_delta: alumnosActuales - alumnosAnteriores,
        cumplimiento_pct: calcularCumplimientoPct(aTiempoRetardoActual),
        meta_pct: META_CUMPLIMIENTO_PCT,
        retardos_semana: aTiempoRetardoActual.retardo,
        retardos_delta: aTiempoRetardoActual.retardo - aTiempoRetardoAnterior.retardo,
        faltas_semana: faltasActuales,
        faltas_delta: faltasActuales - faltasAnteriores,
      };
    } catch (error) {
      logger.error('Error obteniendo resumen de asistencia', { error: error.message });
      throw error;
    }
  }

  static async getDistribucion() {
    try {
      const { actual } = periodosComparables();
      const [aTiempoRetardo, faltas] = await Promise.all([
        ReportesAsistenciaModel.contarATiempoYRetardos(actual.desde, actual.hasta),
        ReportesAsistenciaModel.contarFaltas(actual.desde, actual.hasta),
      ]);

      return {
        a_tiempo: aTiempoRetardo.a_tiempo,
        retardo: aTiempoRetardo.retardo,
        falta: faltas,
      };
    } catch (error) {
      logger.error('Error obteniendo distribución de asistencia', { error: error.message });
      throw error;
    }
  }

  static async getTendencia(dias) {
    try {
      const numDias = Math.min(Math.max(parseInt(dias, 10) || 14, 1), 90);
      const hasta = new Date(new Date().toISOString().slice(0, 10));
      const desde = restarDias(hasta, numDias - 1);

      const porDia = await ReportesAsistenciaModel.getTendenciaDiaria(
        toISODate(desde),
        toISODate(hasta)
      );

      const resultado = [];
      for (let i = 0; i < numDias; i += 1) {
        const fecha = toISODate(restarDias(hasta, numDias - 1 - i));
        const datos = porDia.get(fecha) ?? { a_tiempo: 0, retardo: 0 };
        resultado.push({
          fecha,
          a_tiempo: datos.a_tiempo,
          retardo: datos.retardo,
          cumplimiento_pct: calcularCumplimientoPct(datos),
        });
      }
      return resultado;
    } catch (error) {
      logger.error('Error obteniendo tendencia de asistencia', { error: error.message });
      throw error;
    }
  }

  static async getTabla(desdeParam, hastaParam) {
    try {
      const { actual } = periodosComparables();
      const desde = desdeParam || actual.desde;
      const hasta = hastaParam || actual.hasta;
      return await ReportesAsistenciaModel.getTablaAlumnos(desde, hasta);
    } catch (error) {
      logger.error('Error obteniendo tabla de asistencia', { error: error.message });
      throw error;
    }
  }
}

module.exports = ReportesAsistenciaService;
