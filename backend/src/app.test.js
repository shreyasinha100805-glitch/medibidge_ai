import test from 'node:test';
import assert from 'node:assert/strict';

test('scanner save preflight allows the configured origin and idempotency header', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousClientUrl = process.env.CLIENT_URL;
  process.env.NODE_ENV = 'production';
  process.env.CLIENT_URL = 'https://different.example.test';
  const { default: app } = await import('./app.js');
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/medicines`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://medibidge-ai.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization,idempotency-key',
      },
    });
    const allowedHeaders = response.headers.get('access-control-allow-headers') || '';
    const allowedMethods = response.headers.get('access-control-allow-methods') || '';

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://medibidge-ai.vercel.app');
    assert.match(allowedHeaders.toLowerCase(), /authorization/);
    assert.match(allowedHeaders.toLowerCase(), /idempotency-key/);
    assert.match(allowedMethods, /POST/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousClientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = previousClientUrl;
  }
});
