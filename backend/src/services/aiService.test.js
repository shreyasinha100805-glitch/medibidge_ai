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
      assert.equal(call.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
      assert.equal(call.options.headers['x-goog-api-key'], apiKey);
      assert.equal(call.url.includes(apiKey), false);
    }

    const imagePart = JSON.parse(calls[1].options.body).contents[0].parts[0].inlineData;
    assert.equal(imagePart.mimeType, 'image/png');
    assert.equal(imagePart.data, 'iVBORw0KGgo=');
    const requestBody = JSON.parse(calls[1].options.body);
    assert.match(requestBody.contents[0].parts[1].text, /NEVER invent, guess, or assume/);
    assert.equal(requestBody.generationConfig.responseMimeType, 'application/json');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});

test('JPEG, PNG and WEBP signatures are sent with matching MIME types', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  const calls = [];
  const prescription = {
    isValidPrescription: true,
    medicines: [{ name: 'Example medicine', dosage: 1, unit: 'tablet', confidence: 0.9 }],
  };
  const imageFixtures = [
    ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])],
    ['image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ['image/webp', Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ')],
  ];
  process.env.AI_API_KEY = 'unit-test-key-not-a-credential';
  globalThis.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return geminiResponse(JSON.stringify(prescription));
  };

  try {
    for (const [mimeType, bytes] of imageFixtures) {
      const dataUri = `data:${mimeType};base64,${bytes.toString('base64')}`;
      const result = await scanPrescriptionImage(dataUri, mimeType);
      assert.equal(result.isValidPrescription, true);
    }
    assert.deepEqual(
      calls.map((body) => body.contents[0].parts[0].inlineData.mimeType),
      ['image/jpeg', 'image/png', 'image/webp']
    );
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
      (error) => error.statusCode === 503 && error.message.includes('AI_API_KEY')
    );
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});

test('empty, corrupted, oversized and MIME-mismatched uploads are rejected before Gemini', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  let fetchCalls = 0;
  process.env.AI_API_KEY = 'unit-test-key-not-a-credential';
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('Invalid images must not reach Gemini.');
  };

  try {
    const empty = await scanPrescriptionImage('', 'image/png');
    const corrupted = await scanPrescriptionImage('data:image/png;base64,AA==', 'image/png');
    const mismatched = await scanPrescriptionImage('data:image/png;base64,iVBORw0KGgo=', 'image/jpeg');
    const oversizedBytes = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(7 * 1024 * 1024 + 1),
    ]);
    const oversized = await scanPrescriptionImage(
      `data:image/png;base64,${oversizedBytes.toString('base64')}`,
      'image/png'
    );

    assert.equal(empty.isValidPrescription, false);
    assert.equal(corrupted.isValidPrescription, false);
    assert.match(mismatched.rejectionReason, /does not match/);
    assert.match(oversized.rejectionReason, /too large/);
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

test('unsupported model and invalid Gemini credentials return safe actionable errors', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  const originalConsoleError = console.error;
  process.env.AI_API_KEY = 'unit-test-key-not-a-credential';
  console.error = () => {};

  try {
    globalThis.fetch = async () => ({ ok: false, status: 404 });
    await assert.rejects(
      scanPrescriptionImage('data:image/png;base64,iVBORw0KGgo=', 'image/png'),
      (error) => error.statusCode === 503 && error.message.includes('not enabled')
    );

    globalThis.fetch = async () => ({ ok: false, status: 401 });
    await assert.rejects(
      scanPrescriptionImage('data:image/png;base64,iVBORw0KGgo=', 'image/png'),
      (error) => error.statusCode === 503 && error.message.includes('API key')
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});

test('malformed Gemini structured output is rejected without fabricated extraction data', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = 'unit-test-key-not-a-credential';
  globalThis.fetch = async () => geminiResponse('not valid JSON');

  try {
    await assert.rejects(
      scanPrescriptionImage('data:image/png;base64,iVBORw0KGgo=', 'image/png'),
      (error) => error.statusCode === 502 && error.message.includes('invalid structured response')
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});

test('a non-JSON Gemini HTTP response returns a safe invalid-response error', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = 'unit-test-key-not-a-credential';
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => { throw new SyntaxError('Malformed JSON response.'); },
  });

  try {
    await assert.rejects(
      scanPrescriptionImage('data:image/png;base64,iVBORw0KGgo=', 'image/png'),
      (error) => error.statusCode === 502 && error.message.includes('invalid response')
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = originalApiKey;
  }
});
