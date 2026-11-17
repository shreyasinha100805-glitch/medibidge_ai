import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAIResponse, scanPrescriptionImage } from './aiService.js';

const geminiResponse = (text) => ({
  ok: true,
  status: 200,
  json: async () => ({
    candidates: [{ content: { parts: [{ text }] } }],
  }),
});

test('Gemini REST calls keep the API key in the header and send image data inline', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  const apiKey = 'unit-test-key-not-a-credential';
  const calls = [];
  const prescription = {
    isValidPrescription: true,
    medicines: [{ name: 'Example medicine', dosage: 1, unit: 'mg', confidence: 0.9 }],
  };

  process.env.AI_API_KEY = apiKey;
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return calls.length === 1
      ? geminiResponse('Response from the mocked Gemini API.')
      : geminiResponse(JSON.stringify(prescription));
  };

  try {
    const answer = await generateAIResponse('How can I remember my schedule?', {
      medicinesList: [],
      adherenceMonthPercent: 0,
      totalTaken: 0,
      totalMissed: 0,
      lowestAdherenceMed: 'None',
      medicineBreakdown: [],
    });
    const scan = await scanPrescriptionImage('data:image/png;base64,iVBORw0KGgo=', 'image/png', 'test.png');

    assert.equal(answer, 'Response from the mocked Gemini API.');
    assert.equal(scan.isValidPrescription, true);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
      assert.equal(call.options.headers['x-goog-api-key'], apiKey);
      assert.equal(call.url.includes(apiKey), false);
    }

    const imagePart = JSON.parse(calls[1].options.body).contents[0].parts[0].inlineData;
    assert.equal(imagePart.mimeType, 'image/png');
    assert.equal(imagePart.data, 'iVBORw0KGgo=');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});

test('image validation runs before Gemini configuration and missing keys fail closed', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  let fetchCalls = 0;
  process.env.AI_API_KEY = '';
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('The mocked Gemini endpoint must not be called.');
  };

  try {
    const invalidImage = await scanPrescriptionImage('data:image/png;base64,AA==', 'image/png');
    assert.equal(invalidImage.isValidPrescription, false);
    await assert.rejects(
      scanPrescriptionImage('data:image/png;base64,iVBORw0KGgo=', 'image/png'),
      (error) => error.statusCode === 503
    );
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});

test('Gemini timeouts are returned as gateway timeout errors', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = 'unit-test-key-not-a-credential';
  globalThis.fetch = async () => {
    const error = new Error('Mock request timed out.');
    error.name = 'AbortError';
    throw error;
  };

  try {
    await assert.rejects(
      generateAIResponse('How can I remember my schedule?', {
        medicinesList: [],
        adherenceMonthPercent: 0,
        totalTaken: 0,
        totalMissed: 0,
        lowestAdherenceMed: 'None',
        medicineBreakdown: [],
      }),
      (error) => error.statusCode === 504
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});

test('Gemini rate limits are translated to a retryable service-unavailable error', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  const originalConsoleError = console.error;
  process.env.AI_API_KEY = 'unit-test-key-not-a-credential';
  console.error = () => {};
  globalThis.fetch = async () => ({ ok: false, status: 429 });

  try {
    await assert.rejects(
      scanPrescriptionImage('data:image/png;base64,iVBORw0KGgo=', 'image/png'),
      (error) => error.statusCode === 503 && error.message.includes('rate limited')
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});
