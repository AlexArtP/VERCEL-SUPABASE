import fs from 'fs';
import fetch from 'node-fetch';

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
  .split('\n')
  .map(l => l.trim())
  .filter(Boolean)
  .reduce((acc, l) => { const [k, ...v] = l.split('='); acc[k] = v.join('='); return acc }, {});

const sr = env.SUPABASE_SERVICE_ROLE_KEY;
if (!sr) throw new Error('No SUPABASE_SERVICE_ROLE_KEY in .env.local');

const profes = '1a41fb81-4ddc-4703-a81e-8581d058f8e3';
const body = [
  {
    profesionalid: profes,
    profesional_id: profes,
    fecha: '2025-11-05',
    hora_inicio: '09:00:00',
    hora_fin: '10:00:00',
    nombre: 'TestNodeInsert',
    descripcion: 'x',
    fechacreacion: new Date().toISOString(),
    tipo: 'Ingreso'
  }
];

(async () => {
  const res = await fetch('http://127.0.0.1:54321/rest/v1/modulos', {
    method: 'POST',
    headers: {
      'apikey': sr,
      'Authorization': `Bearer ${sr}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('status', res.status);
  console.log('headers', Object.fromEntries(res.headers.entries()));
  console.log('body', text);
})();
