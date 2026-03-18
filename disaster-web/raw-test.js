const http = require('http');

const loginOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const token = JSON.parse(body).token;
      console.log('Got token:', token ? 'Yes' : 'No');
      
      const reqOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/incidents/available-responders?region=Bihar',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const apiReq = http.request(reqOptions, (apiRes) => {
        console.log(`API STATUS: ${apiRes.statusCode}`);
        console.log(`API HEADERS: ${JSON.stringify(apiRes.headers)}`);
        let apiBody = '';
        apiRes.on('data', chunk => apiBody += chunk);
        apiRes.on('end', () => console.log(`API BODY: ${apiBody}`));
      });
      apiReq.end();
    } catch(e) { 
      console.error('Error parsing login response:', e); 
      console.log('RAW LOGIN BODY:', body);
    }
  });
});

loginReq.write(JSON.stringify({email: 'admin@dmas.com', password: 'password123'}));
loginReq.end();
