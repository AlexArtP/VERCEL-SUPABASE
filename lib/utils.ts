import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Calcula las instancias de módulos dados un rango de horas y una duración en minutos.
 * @param horaInicio - formato "HH:mm"
 * @param horaFin - formato "HH:mm"
 * @param duracion - duración en minutos
 * @returns array de instancias con horaInicio y horaFin en formato "HH:mm"
 */
export function calcularInstancias(horaInicio: string, horaFin: string, duracion: number) {
  const trim = (str: string) => str.trim();
  const hi = trim(horaInicio);
  const hf = trim(horaFin);
  const partesI = hi.split(':');
  const partesF = hf.split(':');
  if (partesI.length !== 2 || partesF.length !== 2) return [];
  const hI = parseInt(partesI[0], 10);
  const mI = parseInt(partesI[1], 10);
  const hF = parseInt(partesF[0], 10);
  const mF = parseInt(partesF[1], 10);
  if ([hI, mI, hF, mF].some(isNaN)) return [];
  const startMin = hI * 60 + mI;
  const endMin = hF * 60 + mF;
  if (isNaN(duracion) || duracion <= 0) return [];
  const instancias: { horaInicio: string; horaFin: string }[] = [];
  let current = startMin;
  while (current + duracion <= endMin) {
    const next = current + duracion;
    const hiH = Math.floor(current / 60).toString().padStart(2, '0');
    const hiM = (current % 60).toString().padStart(2, '0');
    const hfH = Math.floor(next / 60).toString().padStart(2, '0');
    const hfM = (next % 60).toString().padStart(2, '0');
    instancias.push({ horaInicio: `${hiH}:${hiM}`, horaFin: `${hfH}:${hfM}` });
    current = next;
  }
  return instancias;
}
