// Integration smoke test: the Express app boots and serves the health route.
// (Routes that proxy OpenDota are not hit here to keep tests offline/fast.)
// Uses http with agent:false so no keep-alive sockets linger and hang the runner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { app } from '../src/index';

function get(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: 'localhost', port, path, agent: false }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
    });
    req.on('error', reject);
  });
}

async function withServer(fn: (port: number) => Promise<void>) {
  const server = app.listen(0);
  await new Promise<void>(r => server.once('listening', () => r()));
  try {
    await fn((server.address() as AddressInfo).port);
  } finally {
    await new Promise<void>(r => server.close(() => r()));
  }
}

test('GET /api/health returns ok', async () => {
  await withServer(async port => {
    const res = await get(port, '/api/health');
    assert.equal(res.status, 200);
    assert.equal(JSON.parse(res.body).status, 'ok');
  });
});

test('unknown route returns 404', async () => {
  await withServer(async port => {
    const res = await get(port, '/api/nope');
    assert.equal(res.status, 404);
  });
});
