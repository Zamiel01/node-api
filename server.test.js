'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const server = require('./server');

function request(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: server.address().address,
        port: server.address().port,
        method,
        path,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () =>
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body),
          })
        );
      }
    );
    req.on('error', reject);
    req.end();
  });
}

test('GET /health returns 200 with ok status', async () => {
  const res = await request('GET', '/health');
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'application/json');
  assert.equal(res.body.status, 'ok');
  assert.equal(typeof res.body.uptime, 'number');
});

test('GET /version returns 200 with version from package.json', async () => {
  const res = await request('GET', '/version');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.version, '1.0.0');
});

test('GET /unknown returns 404', async () => {
  const res = await request('GET', '/unknown');
  assert.equal(res.statusCode, 404);
  assert.ok(res.body.error);
});

test('POST /health returns 404', async () => {
  const res = await request('POST', '/health');
  assert.equal(res.statusCode, 404);
});

test.after(() => {
  server.close();
});
