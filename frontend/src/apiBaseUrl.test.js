import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBaseUrl } from './apiBaseUrl.js';

const productionApiUrl = 'https://medibridge-backend-nq9w.onrender.com/api';

test('uses the local API proxy during development and the Render API in production', () => {
  assert.equal(resolveApiBaseUrl(undefined, false), '/api');
  assert.equal(resolveApiBaseUrl('', true), productionApiUrl);
});

test('ignores the placeholder URL from the example environment file', () => {
  assert.equal(resolveApiBaseUrl('https://<your-render-backend-url>/api', true), productionApiUrl);
});

test('normalizes backend host values to the API route', () => {
  assert.equal(resolveApiBaseUrl('https://api.example.test/', true), 'https://api.example.test/api');
  assert.equal(resolveApiBaseUrl('https://api.example.test/api/', true), 'https://api.example.test/api');
  assert.equal(resolveApiBaseUrl('/api/', true), '/api');
});

test('rejects invalid and insecure production API URLs', () => {
  assert.equal(resolveApiBaseUrl('not a URL', true), productionApiUrl);
  assert.equal(resolveApiBaseUrl('http://api.example.test', true), productionApiUrl);
});
