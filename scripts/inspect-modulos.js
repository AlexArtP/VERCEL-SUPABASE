// scripts/inspect-modulos.js
// Usage: node scripts/inspect-modulos.js
// Requires a Firebase Admin service account JSON at ./serviceAccount.json

const admin = require('firebase-admin')
const fs = require('fs')

if (!fs.existsSync('./serviceAccount.json')) {
  console.error('ERROR: Coloca tu serviceAccount.json en la raíz del proyecto con nombre serviceAccount.json')
  process.exit(1)
}

const serviceAccount = require('../serviceAccount.json')
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

;(async () => {
  try {
    const snap = await db.collection('modulos').get()
    const counts = {}
    const examples = {}
    snap.forEach(doc => {
      const data = doc.data()
      const pid = data.profesionalId
      const key = `${typeof pid}:${String(pid)}`
      counts[key] = (counts[key] || 0) + 1
      if (!examples[key]) examples[key] = []
      if (examples[key].length < 5) examples[key].push({ id: doc.id, profesionalId: pid })
    })

    console.log('Distribución profesionalId (tipo:valor => cuenta):')
    Object.entries(counts).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`${k} => ${v}`))

    console.log('\nEjemplos por tipo:')
    Object.entries(examples).forEach(([k, arr]) => {
      console.log(`\n== ${k} ==`) 
      arr.forEach(x => console.log(x))
    })

    console.log('\nTotal módulos:', snap.size)
    process.exit(0)
  } catch (err) {
    console.error('Error al inspeccionar modulos:', err)
    process.exit(2)
  }
})()
