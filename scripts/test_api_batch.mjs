import fs from 'fs';
import fetch from 'node-fetch';

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf-8')
  .split('\n')
  .map(l => l.trim())
  .filter(Boolean)
  .reduce((acc, l) => { const [k, ...v] = l.split('='); acc[k] = v.join('='); return acc }, {});

const profes = '1a41fb81-4ddc-4703-a81e-8581d058f8e3';
const body = {
  modulos: [
    {
      profesionalid: profes,
      profesional_id: profes,
      fecha: '2025-11-05',
      hora_inicio: '09:00:00',
      hora_fin: '10:00:00',
      nombre: 'TestBatchAPI',
      descripcion: 'x',
      fechacreacion: new Date().toISOString(),
      tipo: 'Ingreso'
    }
  ]
};

(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/modulos/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    console.log('status', res.status);
    console.log('body', txt);
  } catch (err) {
    console.error('error', err);
  }
})();
