(async () => {
  const base = 'http://localhost:3000';
  const ts = Date.now();
  const email = `test+${ts}@example.com`;
  const username = `testuser${ts}`;
  const password = 'TestPass123!';
  const headers = {'Content-Type':'application/json'};

  try {
    let r = await fetch(`${base}/api/auth/register`, {method:'POST', headers, body:JSON.stringify({email, username, password})});
    let json = await r.json();
    console.log('register', r.status, JSON.stringify(json));
  } catch(e){console.error('register error', e.message);}

  try {
    let r = await fetch(`${base}/api/auth/login`, {method:'POST', headers, body:JSON.stringify({emailOrUsername:username, password})});
    let json = await r.json();
    console.log('login', r.status, JSON.stringify(json));
    const token = json?.data?.token || json?.token || (json?.data && json.data.token) || json?.token;
    const authHeader = token ? { 'Authorization': 'Bearer ' + token } : {};

    let r2 = await fetch(`${base}/api/ecg/my-analyses`, {method:'GET', headers: {...headers, ...authHeader}});
    let j2 = await r2.json();
    console.log('protected GET /api/ecg/my-analyses', r2.status, JSON.stringify(j2));
  } catch(e){console.error('login/protected error', e.message);}  
})();
