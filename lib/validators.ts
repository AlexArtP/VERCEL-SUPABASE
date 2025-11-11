// Utilidades puras y testeables: formateo/validación de RUN (RUT chileno) y cálculo de edad

export function formatearRun(input: string): string | null {
  if (!input) return null;
  // Eliminar puntos, espacios y normalizar guion
  const raw = input.toString().trim().replace(/\./g, '').replace(/\s+/g, '');
  const parts = raw.split('-');
  if (parts.length === 1) {
    // puede venir sin guion: último carácter es dv
    const s = parts[0];
    if (s.length < 2) return null;
    const dv = s.slice(-1);
    const nums = s.slice(0, -1);
    return `${parseInt(nums, 10)}-${dv.toUpperCase()}`;
  }

  const nums = parts[0];
  const dv = parts[1];
  if (!nums || !dv) return null;
  return `${parseInt(nums, 10)}-${dv.toUpperCase()}`;
}

export function calcularDigitoVerificador(runNumber: string): string {
  // runNumber: sólo números, sin DV
  const nums = runNumber.replace(/\D/g, '');
  let m = 0;
  let s = 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    s = s + parseInt(nums[i], 10) * (9 - (m % 6));
    m++;
  }
  const res = s % 11;
  if (res === 0) return 'K';
  if (res === 1) return '0';
  return String(11 - res);
}

export function validarRun(input: string): boolean {
  if (!input) return false;
  const formatted = formatearRun(input);
  if (!formatted) return false;
  const [numStr, dvRaw] = formatted.split('-');
  const dv = dvRaw.toUpperCase();
  const nums = numStr.replace(/\D/g, '');
  if (!/^[0-9]+$/.test(nums)) return false;
  // Cálculo tradicional módulo 11
  let sum = 0;
  let factor = 2;
  for (let i = nums.length - 1; i >= 0; i--) {
    sum += parseInt(nums[i], 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const mod = 11 - (sum % 11);
  let expectedDv = '';
  if (mod === 11) expectedDv = '0';
  else if (mod === 10) expectedDv = 'K';
  else expectedDv = String(mod);
  return expectedDv === dv;
}

export function calculateAge(birth: Date | string): number {
  const b = (typeof birth === 'string') ? new Date(birth) : birth;
  if (Number.isNaN(b.getTime())) return NaN;
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) {
    age--;
  }
  return age;
}

export default { formatearRun, validarRun, calculateAge };
