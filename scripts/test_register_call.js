const fetch = globalThis.fetch || require('node-fetch')

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Prueba',
        apellidoPaterno: 'Uno',
        apellidoMaterno: 'Dos',
        run: '12345678-5',
        profesion: 'Medico',
        sobreTi: 'N/A',
        cargoActual: 'N/A',
        email: 'test.local@example.com',
        telefono: '+56900000000',
        password: 'Password123',
        confirmPassword: 'Password123',
      }),
    })

    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Response:', text)
  } catch (e) {
    console.error('Fetch error:', e)
  }
}

run()
