import test from 'node:test';
import assert from 'node:assert/strict';

test('scanner save preflight allows the configured origin and idempotency header', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  const { default: app } = await import('./app.js');
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/medicines`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization,idempotency-key',
      },
    });
    const allowedHeaders = response.headers.get('access-control-allow-headers') || '';
    const allowedMethods = response.headers.get('access-control-allow-methods') || '';

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.match(allowedHeaders.toLowerCase(), /authorization/);
    assert.match(allowedHeaders.toLowerCase(), /idempotency-key/);
    assert.match(allowedMethods, /POST/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
