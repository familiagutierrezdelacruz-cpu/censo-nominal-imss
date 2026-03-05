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
