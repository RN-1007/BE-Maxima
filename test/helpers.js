const http = require('http');
const app = require('../src/app');

let server = null;
let baseUrl = '';

const startServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve({ server, baseUrl });
    });
  });
};

const stopServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        resolve();
      });
    } else {
      resolve();
    }
  });
};

const getTokens = async (serverUrl) => {
  // Login Admin
  const adminRes = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@maxima.com', password: 'Admin123!' }),
  });
  const adminData = await adminRes.json();

  // Login Farmer 1
  const farmerRes = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'petani1@maxima.com', password: 'Petani123!' }),
  });
  const farmerData = await farmerRes.json();

  // Login Farmer 2
  const farmer2Res = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'petani2@maxima.com', password: 'Petani123!' }),
  });
  const farmer2Data = await farmer2Res.json();

  return {
    adminToken: adminData?.data?.token,
    farmerToken: farmerData?.data?.token,
    farmer2Token: farmer2Data?.data?.token,
  };
};

module.exports = {
  startServer,
  stopServer,
  getTokens,
};
