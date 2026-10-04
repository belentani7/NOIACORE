/**
 * Utilidades de fecha/hora para zona horaria Europe/Madrid (España).
 * Cumple con convención horaria española (CET/CEST).
 */

export const SPAIN_TIMEZONE = 'Europe/Madrid';
export const SPAIN_LOCALE = 'es-ES';

/**
 * Formatea una fecha ISO en formato español con zona horaria de Madrid.
 */
export function formatSpanishDate(
  dateStr: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  try {
    return new Intl.DateTimeFormat(SPAIN_LOCALE, {
      ...options,
      timeZone: SPAIN_TIMEZONE,
    }).format(date);
  } catch {
    return date.toLocaleString(SPAIN_LOCALE);
  }
}

/**
 * Formatea solo la hora (HH:mm) en zona horaria de Madrid.
 */
export function formatSpanishTime(dateStr: string | Date): string {
  return formatSpanishDate(dateStr, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea fecha relativa en español ("hace 5 minutos").
 */
export function formatRelativeSpanish(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'hace unos segundos';
  if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHour < 24) return `hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
  if (diffDay < 7) return `hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`;
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  return formatSpanishDate(date, { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Verifica si la hora actual está dentro del horario laboral español.
 * Horario típico: 9:00 - 18:00 (lunes-viernes), zona Europe/Madrid.
 */
export function isBusinessHours(date: Date = new Date()): boolean {
  try {
    const madridTime = new Intl.DateTimeFormat('en-US', {
      timeZone: SPAIN_TIMEZONE,
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      hour12: false,
    }).formatToParts(date);

    const hourPart = madridTime.find((p) => p.type === 'hour')?.value;
    const weekdayPart = madridTime.find((p) => p.type === 'weekday')?.value;

    if (!hourPart || !weekdayPart) return false;

    const hour = parseInt(hourPart, 10);
    const isWeekday = !['Sat', 'Sun'].includes(weekdayPart);

    return isWeekday && hour >= 9 && hour < 18;
  } catch {
    return false;
  }
}

/**
 * Obtiene la hora actual en Madrid en formato HH:mm.
 */
export function getMadridTime(): string {
  return new Intl.DateTimeFormat(SPAIN_LOCALE, {
    timeZone: SPAIN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

/**
 * Lista de festivos nacionales de España (2025-2026).
 * Para validaciones de horario de atención.
 */
export const SPANISH_HOLIDAYS_2025 = [
  '2025-01-01', // Año Nuevo
  '2025-01-06', // Reyes
  '2025-04-18', // Viernes Santo
  '2025-05-01', // Día del Trabajador
  '2025-08-15', // Asunción
  '2025-10-12', // Fiesta Nacional
  '2025-11-01', // Todos los Santos
  '2025-12-06', // Constitución
  '2025-12-08', // Inmaculada
  '2025-12-25', // Navidad
];

// Festivos específicos de Cataluña
export const CATALONIA_HOLIDAYS_2025 = [
  '2025-06-24', // San Juan
  '2025-09-11', // Diada de Catalunya
  '2025-12-26', // San Esteban
];
