// scripts/migrate-profesionalId.js
// Usage examples:
//  node scripts/migrate-profesionalId.js --to=uid --dry
//  node scripts/migrate-profesionalId.js --to=docid
// Requires a Firebase Admin service account JSON at ./serviceAccount.json

const admin = require('firebase-admin')
const fs = require('fs')

const argv = require('minimist')(process.argv.slice(2))
const to = argv.to // 'uid' or 'docid'
const dry = argv.dry || false

if (!to || (to !== 'uid' && to !== 'docid')) {
  console.error("Usage: --to=uid|docid [--dry]")
  process.exit(1)
}

if (!fs.existsSync('./serviceAccount.json')) {
  console.error('ERROR: Coloca tu serviceAccount.json en la raíz del proyecto con nombre serviceAccount.json')
  process.exit(1)
}

const serviceAccount = require('../serviceAccount.json')
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

;(async () => {
  try {
    console.log('Construyendo mapa de usuarios (docId <-> uid) desde collection usuarios...')
    const usersSnap = await db.collection('usuarios').get()
    const docToUid = {}
    const uidToDoc = {}
    usersSnap.forEach(d => {
      const data = d.data()
      const uid = data.uid || data.authUid || data.firebaseUid || null
      // prefer explicit uid field, otherwise try doc.id
      if (uid) {
        docToUid[d.id] = uid
        uidToDoc[uid] = d.id
      } else {
        // fallback: consider doc.id might be uid
        docToUid[d.id] = d.id
        uidToDoc[d.id] = d.id
      }
    })

    console.log(`Usuarios map size: ${Object.keys(docToUid).length}`)

    const modulosSnap = await db.collection('modulos').get()
    console.log(`Encontrados ${modulosSnap.size} modulos`)

    const ops = []
    let changed = 0

    modulosSnap.forEach(doc => {
      const data = doc.data()
      const current = data.profesionalId
      let target = current

      if (to === 'uid') {
        // if profesionalId is a doc id and maps to uid, convert
        if (docToUid[current]) {
          target = docToUid[current]
        } else if (uidToDoc[current]) {
          // already a uid
          target = current
        } else {
          // unknown: leave unchanged
          target = current
        }
      } else if (to === 'docid') {
        // if profesionalId is a uid and maps to doc id, convert
        if (uidToDoc[current]) {
          target = uidToDoc[current]
        } else if (docToUid[current]) {
          // already a doc id
          target = current
        } else {
          target = current
        }
      }

      if (String(current) !== String(target)) {
        changed++
        ops.push({ id: doc.id, from: current, to: target })
      }
    })

    console.log(`Cambios detectados: ${changed}`)
    if (changed > 0) console.table(ops.slice(0, 50))

    if (dry) {
      console.log('Modo dry-run: no se aplicarán cambios. Añade --dry=false para ejecutar')
      process.exit(0)
    }

    if (changed === 0) {
      console.log('Nada que cambiar.')
      process.exit(0)
    }

    // Apply updates in batches
    const batchSize = 500
    for (let i = 0; i < ops.length; i += batchSize) {
      const batch = db.batch()
      const slice = ops.slice(i, i + batchSize)
      slice.forEach(op => {
        const ref = db.collection('modulos').doc(op.id)
        batch.update(ref, { profesionalId: op.to })
      })
      console.log(`Aplicando batch ${i / batchSize + 1} (${slice.length} updates) ...`)
      await batch.commit()
    }

    console.log('Migración completada con éxito.')
    process.exit(0)
  } catch (err) {
    console.error('Error durante migración:', err)
    process.exit(2)
  }
})()
