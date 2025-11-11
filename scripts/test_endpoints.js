const fetch = require('node-fetch');

(async ()=>{
  try{
    const base = 'http://localhost:3000';
    console.log('GET /api/profile?id=1');
    const r1 = await fetch(`${base}/api/profile?id=1`);
    const j1 = await r1.text();
    console.log('Status:', r1.status);
    console.log('Body:', j1);

    console.log('\nPOST /api/auth/change-password (expected to fail or return 401)');
    const r2 = await fetch(`${base}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ana@ejemplo.test', currentPassword: 'wrongpass', newPassword: 'newpassword123' })
    });
    const j2 = await r2.text();
    console.log('Status:', r2.status);
    console.log('Body:', j2);

    process.exit(0);
  }catch(e){
    console.error('Error testing endpoints:', e);
    process.exit(2);
  }
})();
