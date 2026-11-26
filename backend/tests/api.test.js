const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const { JWT_SECRET } = require('../src/middleware/authMiddleware');
const { isValidEmail, isPositiveInt, isNonEmptyString } = require('../src/utils/validators');

test('Validators: email, positive int, and non-empty string checks', () => {
  assert.equal(isValidEmail('user@example.com'), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isPositiveInt(5), true);
  assert.equal(isPositiveInt(0), false);
  assert.equal(isPositiveInt(-2), false);
  assert.equal(isNonEmptyString('CineBook'), true);
  assert.equal(isNonEmptyString('   '), false);
});

test('Protected admin routes reject unauthenticated requests with 401', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/admin/dashboard',
          method: 'GET',
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.end();
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
  } finally {
    server.close();
  }
});

test('Non-admin JWT token is rejected with 403', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const userToken = jwt.sign({ id: 99, username: 'guest', role: 'user' }, JWT_SECRET);

  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/admin/dashboard',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        }
      );
      req.on('error', reject);
      req.end();
    });

    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
  } finally {
    server.close();
  }
});
