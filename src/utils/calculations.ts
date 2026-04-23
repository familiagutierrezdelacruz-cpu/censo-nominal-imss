import { format, differenceInYears, addDays, subMonths, addYears, parseISO, differenceInDays, differenceInWeeks, isValid } from 'date-fns';

export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const date = parseISO(dob);
  if (!isValid(date)) return 0;
  return differenceInYears(new Date(), date);
};

export const calculateSDG = (fum: string): string => {
  if (!fum) return '0 sem 0 d';
  const fumDate = parseISO(fum);
  if (!isValid(fumDate)) return '0 sem 0 d';
  const today = new Date();
  const totalDays = differenceInDays(today, fumDate);

  if (totalDays < 0) return '0 sem 0 d';

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} sem ${days} d`;
};

export const calculateFPP = (fum: string): string => {
  if (!fum) return '';
  const fumDate = parseISO(fum);
  if (!isValid(fumDate)) return '';
  // Naegele's Rule: FUM + 7 days - 3 months + 1 year
  const fppDate = addYears(subMonths(addDays(fumDate, 7), 3), 1);
  return format(fppDate, 'yyyy-MM-dd');
};

export const calculateTAM = (tas: number, tad: number): number => {
  if (!tas || !tad) return 0;
  return parseFloat(((tas + 2 * tad) / 3).toFixed(1));
};

export const calculatePuerperioDays = (eventDate: string): number => {
  if (!eventDate) return 0;
  const date = parseISO(eventDate);
  if (!isValid(date)) return 0;
  return differenceInDays(new Date(), date);
};

export const calculateDaysSinceUpdate = (lastConsultation: string): number => {
  if (!lastConsultation) return 0;
  const date = parseISO(lastConsultation);
  if (!isValid(date)) return 0;
  return differenceInDays(new Date(), date);
};
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '---';
  const date = parseISO(dateStr);
  if (!isValid(date)) return dateStr;
  return format(date, 'dd/MM/yy');
};

export const getVaccineAlerts = (fum: string, td_fecha_1ra: string, td_fecha_2da: string, tdpa_fecha: string, influenza_fecha: string): string[] => {
  const alerts: string[] = [];
  if (!fum) return alerts;

  const fumDate = parseISO(fum);
  if (!isValid(fumDate)) return alerts;
  const totalDays = differenceInDays(new Date(), fumDate);
  const weeks = Math.floor(totalDays / 7);

  // Influenza Alert (any trimester)
  if (!influenza_fecha) {
    alerts.push('Influenza pendiente');
  }

  // Td Alerts
  if (!td_fecha_1ra) {
    alerts.push('Td (1ra dosis) pendiente');
  } else if (!td_fecha_2da) {
    const d1 = parseISO(td_fecha_1ra);
    if (isValid(d1) && differenceInDays(new Date(), d1) >= 28) { // 4 weeks
      alerts.push('Td (2da dosis) pendiente (> 4 sem de la 1ra)');
    }
  }

  // Tdpa Alert (20-32 SDG ideally, but > 20)
  if (weeks >= 20 && !tdpa_fecha) {
    alerts.push('Tdpa pendiente (requerido > 20 SDG)');
  }

  return alerts;
};

export const checkCriteria = (record: any, type: string): boolean => {
  if (!record.condicion?.startsWith('EMBARAZADA')) return false;
  
  const today = new Date();
  const fumDate = record.fum ? parseISO(record.fum) : null;
  const weeks = fumDate && isValid(fumDate) ? Math.floor(differenceInDays(today, fumDate) / 7) : 0;
  
  switch (type) {
    case 'sdg_41':
      return weeks >= 41;
      
    case 'sdg_37_40':
      return weeks >= 37 && weeks < 41;
      
    case 'no_update':
      return calculateDaysSinceUpdate(record.fecha_ultima_consulta) > 30;
      
    case 'missed_apt':
      if (!record.fecha_proxima_cita) return false;
      const aptDate = parseISO(record.fecha_proxima_cita);
      // Missed if appointment date plus 1 day is before today (at midnight)
      return isValid(aptDate) && aptDate < new Date(today.setHours(0,0,0,0));
      
    case 'cesarea_38':
      return (record.cesareas > 0) && weeks >= 38;
      
    default:
      return false;
  }
};
