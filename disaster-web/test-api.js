async function test() {
  // 1. Register the admin user
  const registerRes = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Admin User',
      email: 'admin@dmas.com',
      password: 'password123',
      phoneNumber: '9999999999',
      region: 'Delhi',
      role: 'ADMIN'
    })
  });
  console.log('Register Status:', registerRes.status);
  console.log('Register Body:', await registerRes.text());

  // 2. Login
  const loginRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({email: 'admin@dmas.com', password: 'password123'})
  });
  console.log('Login Status:', loginRes.status);
  const loginData = await loginRes.text();
  console.log('Login Body:', loginData);
  
  if (!loginRes.ok) return;
  const token = JSON.parse(loginData).token;
  
  // 3. Hit the endpoint
  const apiRes = await fetch('http://localhost:8080/api/incidents/available-responders?region=Bihar', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('API Status:', apiRes.status);
  console.log('API Body:', await apiRes.text());
}
test();
