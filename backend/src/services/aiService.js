import Medicine from '../models/Medicine.js';
import MedicationLog from '../models/MedicationLog.js';
import ApiError from '../utils/ApiError.js';
import {
  getMonthAdherence,
  getMedicineWiseAdherence
} from './adherenceService.js';
import { getRollingDateRange } from '../utils/timeZone.js';

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const isConfiguredAIKey = (value) => {
  const apiKey = typeof value === 'string' ? value.trim() : '';
  return Boolean(apiKey) && !/^(?:your(?:[_ -].*)?|replace(?:[_ -].*)?|<[^>]+>)$/i.test(apiKey);
};

const geminiApiError = (response, operation) => {
  // Log only the response status and operation; never log credentials or request bodies.
  console.error(`Gemini ${operation} request failed with HTTP ${response.status}.`);
  if (response.status === 429) {
    return new ApiError(503, 'The AI service is busy or rate limited. Please try again later.');
  }
  if (response.status === 401 || response.status === 403) {
    return new ApiError(503, 'Gemini rejected the configured API key or its permissions. Check the backend AI_API_KEY settings.');
  }
  if (response.status === 404) {
    return new ApiError(503, `The configured Gemini model (${GEMINI_MODEL}) is unavailable. Check GEMINI_MODEL and model access.`);
  }
  return new ApiError(502, 'The AI service could not complete this request. Please try again later.');
};


/*
|--------------------------------------------------------------------------
| PATIENT AI CONTEXT
|--------------------------------------------------------------------------
*/

export const buildPatientAIContext = async (patientId, timeZone = 'UTC') => {

  const monthRange = getRollingDateRange(new Date(), 30, timeZone);

  const [
    medicines,
    monthAdherence,
    medicineWise
  ] = await Promise.all([

    Medicine
      .find({
        patientId,
        isActive: true
      })
      .select(
        'name dosage unit category scheduledTime instructions frequency'
      ),

    getMonthAdherence(patientId, timeZone),

    getMedicineWiseAdherence(
      patientId,
      monthRange.start,
      monthRange.end
    )

  ]);

  const lowestAdherenceMed =
    medicineWise.length > 0
      ? [...medicineWise].sort(
          (a, b) =>
            a.adherencePercentage -
            b.adherencePercentage
        )[0]
      : null;

  const recentLogs =
    await MedicationLog
      .find({ patientId })
      .sort({ scheduledTime: -1 })
      .limit(15)
      .populate(
        'medicineId',
        'name scheduledTime'
      );

  return {

    medicinesCount: medicines.length,

    medicinesList: medicines.map(
      (m) =>
        `${m.name} (${m.dosage}${m.unit}, ${m.category}) scheduled at ${m.scheduledTime} - ${m.instructions || 'No special notes'}`
    ),

    adherenceMonthPercent:
      monthAdherence.adherencePercentage,

    totalScheduled:
      monthAdherence.totalScheduled,

    totalTaken:
      monthAdherence.taken,

    totalMissed:
      monthAdherence.missed,

    lowestAdherenceMed:
      lowestAdherenceMed
        ? `${lowestAdherenceMed.name} (${lowestAdherenceMed.adherencePercentage}% adherence, ${lowestAdherenceMed.missed} doses missed)`
        : 'None',

    medicineBreakdown:
      medicineWise.map(
        (m) =>
          `${m.name}: ${m.adherencePercentage}% taken (${m.taken}/${m.taken + m.missed})`
      ),

    recentLogsSample:
      recentLogs
        .slice(0, 5)
        .map(
          (l) =>
            `${l.medicineId?.name || 'Medication'} scheduled ${new Date(
              l.scheduledTime
            ).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              timeZone,
            })} status: ${l.status}`
        )

  };

};


/*
|--------------------------------------------------------------------------
| AI ASSISTANT
|--------------------------------------------------------------------------
*/

export const generateAIResponse = async (
  question,
  patientContext
) => {

  if (isEmergencyQuestion(question)) {
    return buildEmergencyResponse();
  }

  const apiKey = process.env.AI_API_KEY;

  if (!isConfiguredAIKey(apiKey)) {
    throw new ApiError(503, 'The AI assistant is not configured. Please try again later.');
  }

  const systemInstructions = `
You are MediBridge AI.

You are a medication adherence assistant.

PATIENT INFORMATION:

Active medicines:
${patientContext.medicinesList.join('; ') || 'None registered'}

30-day adherence:
${patientContext.adherenceMonthPercent}%

Taken:
${patientContext.totalTaken}

Missed:
${patientContext.totalMissed}

Lowest adherence medicine:
${patientContext.lowestAdherenceMed}

Medicine performance:
${patientContext.medicineBreakdown.join(' | ')}

SAFETY RULES:

1. Never change a prescribed dosage.
2. Never recommend stopping a medicine.
3. Never diagnose a disease.
4. Do not replace a doctor or pharmacist.
5. Focus on adherence, reminders and routine.
6. Clearly tell the user to consult a doctor for medical decisions.
`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `${systemInstructions}\n\nUSER QUESTION:\n${question}` }],
        }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
      }),
    });

    if (!response.ok) {
      throw geminiApiError(response, 'assistant');
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new ApiError(502, 'The AI service returned an empty response. Please try again.');
    }
    return text.trim();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new ApiError(504, 'The AI service took too long to respond. Please try again.');
    }
    throw new ApiError(502, 'The AI service is temporarily unavailable. Please try again later.');
  } finally {
    clearTimeout(timeout);
  }

};

function isEmergencyQuestion(question) {
  const q = String(question || '').toLowerCase();

  return [
    'unstable',
    'faint',
    'fainted',
    'unconscious',
    'breathing problem',
    'can not breathe',
    "can't breathe",
    'chest pain',
    'severe pain',
    'seizure',
    'stroke',
    'hospital',
    'emergency',
    'ambulance'
  ].some((term) => q.includes(term));
}

function buildEmergencyResponse() {
  return `## Emergency guidance

If the patient is unstable, unconscious, having chest pain, breathing trouble, seizures, stroke symptoms, severe allergic reaction, or severe weakness, treat it as an emergency.

1. Call your local emergency number immediately. In India, call 112 or 108. In the US, call 911.
2. Do not wait for the app or AI response before getting medical help.
3. Keep the patient lying safely on their side if unconscious and breathing.
4. Do not give food, water, or extra medicine unless a doctor tells you.
5. Take the prescription, medicine bottles, allergy details, and recent dose history to the hospital.

Nearby hospital search:
https://www.google.com/maps/search/hospitals+near+me

MediBridge AI can support reminders and adherence, but urgent symptoms need real medical care now.`;
}


/*
|--------------------------------------------------------------------------
| PRESCRIPTION VISION SCANNER
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This function NEVER invents a medicine.
|
*/

export const scanPrescriptionImage = async (
  imageBase64,
  mimeType = 'image/jpeg',
  fileName = ''
) => {

  const apiKey =
    process.env.AI_API_KEY;

  if (!imageBase64) {

    return {
      isValidPrescription: false,
      rejectionReason:
        'No image was received.'
    };

  }

  if (typeof imageBase64 !== 'string') {
    return {
      isValidPrescription: false,
      rejectionReason: 'The uploaded image data is invalid.',
    };
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATE MIME TYPE
  |--------------------------------------------------------------------------
  */

  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  const dataUriMatch = imageBase64.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
  const cleanBase64 = dataUriMatch ? dataUriMatch[2] : imageBase64;
  const submittedMime = (dataUriMatch?.[1] || mimeType || '').toLowerCase();
  const normalizedMime = submittedMime === 'image/jpg' ? 'image/jpeg' : submittedMime;

  if (!allowedMimeTypes.includes(submittedMime) || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cleanBase64)) {

    return {
      isValidPrescription: false,
      rejectionReason:
        'Unsupported image format. Please upload JPG, PNG or WEBP.'
    };

  }


  /*
  |--------------------------------------------------------------------------
  | CLEAN BASE64
  |--------------------------------------------------------------------------
  */

  const imageBuffer = Buffer.from(cleanBase64, 'base64');
  if (imageBuffer.length > 7 * 1024 * 1024) {
    return {
      isValidPrescription: false,
      rejectionReason: 'The image is too large. Please upload an image under 7 MB.',
    };
  }

  const detectedMime = imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8 && imageBuffer[2] === 0xff
    ? 'image/jpeg'
    : imageBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      ? 'image/png'
      : imageBuffer.toString('ascii', 0, 4) === 'RIFF' && imageBuffer.toString('ascii', 8, 12) === 'WEBP'
        ? 'image/webp'
        : null;

  if (!detectedMime || detectedMime !== normalizedMime) {
    return {
      isValidPrescription: false,
      rejectionReason: 'The file contents do not match a supported JPG, PNG, or WEBP image.',
    };
  }

  if (!isConfiguredAIKey(apiKey)) {
    throw new ApiError(503, 'The AI vision service is not configured. Please try again later.');
  }


  /*
  |--------------------------------------------------------------------------
  | GEMINI PROMPT
  |--------------------------------------------------------------------------
  */

  const visionPrompt = `
You are MediBridge Prescription Vision AI — a medical image classifier and data extractor.

STEP 1 — IMAGE CLASSIFICATION (do this first, before anything else):

Look at the image carefully and determine what it actually shows.

IMMEDIATELY return isValidPrescription=false if the image contains ANY of the following:
- A human face, selfie, portrait, or body photograph
- A person or group of people
- An animal (pet, wildlife, bird, insect, etc.)
- A landscape, nature scene, sky, or outdoor scenery
- A food item, drink, or meal
- A vehicle, furniture, electronic device, or household object
- A screenshot of a website, app, social media, code editor, or computer desktop
- A blank, solid-colour, corrupted, or unrecognisable image
- A chart, diagram, graph, or presentation slide
- A non-medical document (invoice, receipt, ID card, certificate, homework, etc.)

ONLY proceed to extraction if the image clearly shows ONE of these:
- A handwritten or printed doctor's prescription
- A hospital or clinic prescription form
- A medicine bottle, blister pack, strip, or packaging with a medicine label
- A pharmacy dispensing label attached to a medicine container

STEP 2 — EXTRACTION RULES (only if image passed Step 1):

1. NEVER invent, guess, or assume any medicine name, active ingredient, dosage, frequency, duration, or instruction.
2. NEVER use example values such as Amoxicillin, Paracetamol, Spondin, or Gintac unless that exact word is visibly printed or handwritten in the image.
3. Only extract text that is clearly visible and readable.
4. If the medicine name is blurry, partially visible, or uncertain, return isValidPrescription=false.
5. If any critical field (name, dosage) cannot be read with confidence >= 0.70, omit that medicine entirely.
6. Never fabricate patient name, doctor name, or instructions.
7. Include an active ingredient only when it is clearly printed; otherwise return an empty string.
8. Return dosage as a positive numeric amount only, and put its printed unit in the unit field. If the dosage amount is unclear, omit that medicine.

STEP 3 — RESPONSE FORMAT:

For a valid prescription or medicine label:
{
  "isValidPrescription": true,
  "patientName": "",
  "doctorName": "",
  "medicines": [
    {
      "name": "",
      "activeIngredient": "",
      "dosage": "",
      "unit": "",
      "frequency": "",
      "scheduledTime": "",
      "duration": "",
      "instructions": "",
      "confidence": 0.0
    }
  ]
}

For ANY invalid, non-medical, or unrecognisable image:
{
  "isValidPrescription": false,
  "medicines": [],
  "rejectionReason": "Invalid Image. Please upload a valid medical prescription or supported medicine label."
}

CONFIDENCE scale:
0.95 = text is clearly and fully readable
0.80 = mostly readable, minor uncertainty
0.70 = minimum threshold — below this, exclude the medicine
below 0.70 = do NOT include in medicines array

Return ONLY valid JSON. No explanations, no markdown, no extra text.
`;


  /*
  |--------------------------------------------------------------------------
  | CALL GEMINI
  |--------------------------------------------------------------------------
  */

  if (isConfiguredAIKey(apiKey)) {
    const geminiController = new AbortController();
    const geminiTimeout = setTimeout(() => geminiController.abort(), 60000);

    try {

      const response =
        await fetch(
          GEMINI_API_URL,
          {
            method: 'POST',
            signal: geminiController.signal,

            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },

            body: JSON.stringify({

              contents: [
                {
                  role: 'user',

                  parts: [

                    {
                      inlineData: {
                        mimeType: normalizedMime,
                        data: cleanBase64
                      }
                    },

                    {
                      text:
                        visionPrompt
                    }

                  ]

                }
              ],

              generationConfig: {

                temperature: 0,

                maxOutputTokens: 1500,

                responseMimeType:
                  'application/json'

              }

            })

          }
        );

      /*
      |--------------------------------------------------------------------------
      | GEMINI ERROR
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {
        throw geminiApiError(response, 'vision');
      }


      /*
      |--------------------------------------------------------------------------
      | READ GEMINI RESPONSE
      |--------------------------------------------------------------------------
      */

      const data =
        await response.json();

      const text =
        data?.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text;


      if (!text) {

        return {
          isValidPrescription: false,

          rejectionReason:
            'The AI could not read any information from this image.'
        };

      }


      /*
      |--------------------------------------------------------------------------
      | PARSE JSON
      |--------------------------------------------------------------------------
      */

      let parsed;

      try {

        parsed =
          JSON.parse(text);

      } catch (error) {

        const jsonMatch =
          text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {

          return {
            isValidPrescription: false,

            rejectionReason:
              'The AI returned an unreadable result. Please upload a clearer image.'
          };

        }

        parsed =
          JSON.parse(
            jsonMatch[0]
          );

      }


      /*
      |--------------------------------------------------------------------------
      | INVALID PRESCRIPTION
      |--------------------------------------------------------------------------
      */

      if (parsed.isValidPrescription !== true) {

        return {

          isValidPrescription:
            false,

          medicines: [],

          rejectionReason:
            parsed.rejectionReason ||
            'No valid prescription could be detected.'

        };

      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE MEDICINES
      |--------------------------------------------------------------------------
      */

      if (
        !Array.isArray(
          parsed.medicines
        ) ||
        parsed.medicines.length === 0
      ) {

        return {

          isValidPrescription:
            false,

          medicines: [],

          rejectionReason:
            'No medicine could be confidently identified in the prescription.'

        };

      }


      /*
      |--------------------------------------------------------------------------
      | REMOVE INVALID MEDICINES
      |--------------------------------------------------------------------------
      */

      const validMedicines =
        parsed.medicines
          .filter((medicine) => {

            if (!medicine) {
              return false;
            }

            const name =
              String(
                medicine.name || ''
              ).trim();

            const confidence =
              Number(
                medicine.confidence || 0
              );
            const dosage = Number(medicine.dosage);

            return (
              name.length > 1 &&
              Number.isFinite(dosage) &&
              dosage > 0 &&
              confidence >= 0.70
            );

          })
          .map((medicine) => ({

            name:
              String(
                medicine.name
              ).trim(),

            activeIngredient:
              String(
                medicine.activeIngredient || ''
              ).trim(),

            dosage:
              String(
                medicine.dosage || ''
              ).trim(),

            unit:
              String(
                medicine.unit || ''
              ).trim(),

            frequency:
              String(
                medicine.frequency || ''
              ).trim(),

            scheduledTime:
              String(
                medicine.scheduledTime || ''
              ).trim(),

            duration:
              String(
                medicine.duration || ''
              ).trim(),

            instructions:
              String(
                medicine.instructions || ''
              ).trim(),

            confidence:
              Number(
                medicine.confidence || 0
              )

          }));


      /*
      |--------------------------------------------------------------------------
      | NO CONFIDENT MEDICINE
      |--------------------------------------------------------------------------
      */

      if (
        validMedicines.length === 0
      ) {

        return {

          isValidPrescription:
            false,

          medicines: [],

          rejectionReason:
            'The medicine name could not be read with enough confidence. Please upload a clearer image.'

        };

      }


      /*
      |--------------------------------------------------------------------------
      | RETURN REAL AI RESULT
      |--------------------------------------------------------------------------
      */

      return {

        isValidPrescription:
          true,

        patientName:
          parsed.patientName || '',

        doctorName:
          parsed.doctorName || '',

        medicines:
          validMedicines,

        /*
        | Compatibility with your existing UI.
        | The first medicine is displayed in the current schedule card.
        */

        name:
          validMedicines[0].name,

        activeIngredient:
          validMedicines[0].activeIngredient,

        dosage:
          validMedicines[0].dosage,

        unit:
          validMedicines[0].unit,

        category:
          'Other',

        scheduledTime:
          validMedicines[0].scheduledTime,

        frequency:
          validMedicines[0].frequency ||
          '',

        duration:
          validMedicines[0].duration ||
          '',

        instructions:
          validMedicines[0].instructions,

        confidenceScore:
          validMedicines[0].confidence,

        aiModelUsed:
          `Gemini Vision (${GEMINI_MODEL})`

      };


    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new ApiError(504, 'The AI vision service took too long to respond. Please try again.');
      }
      throw new ApiError(502, 'Unable to analyze the prescription image. Please try again later.');
    } finally {
      clearTimeout(geminiTimeout);
    }

  }


  /*
  |--------------------------------------------------------------------------
  | NO API KEY — REJECT SAFELY
  |--------------------------------------------------------------------------
  |
  | When no Gemini API key is configured the backend CANNOT analyse the
  | image content. Returning invented medicine data would be dangerous, so
  | we reject with a clear message instead of fabricating a prescription.
  |
  */

  return {
    isValidPrescription: false,
    medicines: [],
    rejectionReason:
      'The AI vision service is not configured. Please contact the administrator to enable prescription scanning.'
  };
};
