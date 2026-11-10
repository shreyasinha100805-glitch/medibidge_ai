import Medicine from '../models/Medicine.js';
import MedicationLog from '../models/MedicationLog.js';
import {
  getMonthAdherence,
  getMedicineWiseAdherence
} from './adherenceService.js';

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


/*
|--------------------------------------------------------------------------
| PATIENT AI CONTEXT
|--------------------------------------------------------------------------
*/

export const buildPatientAIContext = async (patientId) => {

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

    getMonthAdherence(patientId),

    getMedicineWiseAdherence(
      patientId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
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
              minute: '2-digit'
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

  const isDemoKey =
    !apiKey ||
    apiKey === 'your_ai_api_key';

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

  if (!isDemoKey) {

    try {

      const response = await fetch(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({

            contents: [
              {
                role: 'user',

                parts: [
                  {
                    text:
                      systemInstructions +
                      '\n\nUSER QUESTION:\n' +
                      question
                  }
                ]
              }
            ],

            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 700
            }

          })
        }
      );

      if (response.ok) {

        const data =
          await response.json();

        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {

          return text;

        }

      } else {

        const errorText =
          await response.text();

        console.error(
          'Gemini AI error:',
          response.status,
          errorText
        );

      }

    } catch (error) {

      console.error(
        'Gemini AI request failed:',
        error.message
      );

    }

  }

  return buildSmartFallbackResponse(
    question,
    patientContext
  );

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
| FALLBACK AI RESPONSE
|--------------------------------------------------------------------------
*/

function buildSmartFallbackResponse(
  question,
  context
) {

  const q =
    question.toLowerCase();

  let body = '';

  if (
    q.includes('why') ||
    q.includes('miss') ||
    q.includes('drop') ||
    q.includes('low')
  ) {

    body =
      `Your current 30-day medication adherence is **${context.adherenceMonthPercent}%**.\n\n` +

      `The medicine with the lowest adherence is **${context.lowestAdherenceMed}**.\n\n` +

      `### Suggestions\n` +

      `• Set an alarm before the scheduled medicine time.\n` +
      `• Keep medicines in a visible and safe location.\n` +
      `• Connect a caretaker for additional monitoring.\n` +
      `• Mark medicines as taken immediately after taking them.`;

  } else if (
    q.includes('which') ||
    q.includes('summary') ||
    q.includes('stat')
  ) {

    body =
      `### Medication Summary\n\n` +

      `• Active medicines: ${context.medicinesCount}\n` +
      `• 30-day adherence: ${context.adherenceMonthPercent}%\n` +
      `• Taken doses: ${context.totalTaken}\n` +
      `• Missed doses: ${context.totalMissed}\n\n` +

      `### Medicine Performance\n` +

      context.medicineBreakdown.join('\n');

  } else {

    body =
      `You currently have **${context.medicinesCount} active medicine(s)**.\n\n` +

      `Your 30-day adherence is **${context.adherenceMonthPercent}%**.\n\n` +

      `I can help you understand your medication schedule and improve adherence.`;

  }

  return (
    body +
    `\n\n*Disclaimer: MediBridge AI provides adherence and reminder support. It does not replace medical diagnosis or professional medical advice.*`
  );

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

  if (!allowedMimeTypes.includes(mimeType)) {

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

  let cleanBase64 =
    imageBase64;

  if (
    imageBase64.includes(';base64,')
  ) {

    cleanBase64 =
      imageBase64.split(';base64,')[1];

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

1. NEVER invent, guess, or assume any medicine name, dosage, frequency, or instruction.
2. NEVER use example values such as Amoxicillin, Paracetamol, Spondin, or Gintac unless that exact word is visibly printed or handwritten in the image.
3. Only extract text that is clearly visible and readable.
4. If the medicine name is blurry, partially visible, or uncertain, return isValidPrescription=false.
5. If any critical field (name, dosage) cannot be read with confidence >= 0.70, omit that medicine entirely.
6. Never fabricate patient name, doctor name, or instructions.

STEP 3 — RESPONSE FORMAT:

For a valid prescription or medicine label:
{
  "isValidPrescription": true,
  "patientName": "",
  "doctorName": "",
  "medicines": [
    {
      "name": "",
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

  if (
    apiKey &&
    apiKey !== 'your_ai_api_key'
  ) {

    try {

      // 60-second timeout for the Gemini Vision API call.
      // Without this, a slow/hanging Gemini response causes the
      // frontend AbortController to fire first, surfacing the cryptic
      // "signal is aborted without reason" error to the user.
      const geminiController = new AbortController();
      const geminiTimeout = setTimeout(
        () => geminiController.abort(),
        60000
      );

      const response =
        await fetch(
          `${GEMINI_API_URL}?key=${apiKey}`,
          {
            method: 'POST',
            signal: geminiController.signal,

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              contents: [
                {
                  role: 'user',

                  parts: [

                    {
                      inlineData: {
                        mimeType,
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

      clearTimeout(geminiTimeout);


      /*
      |--------------------------------------------------------------------------
      | GEMINI ERROR
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {

        const errorText =
          await response.text();

        console.error(
          'Gemini Vision API Error:',
          response.status,
          errorText
        );

        return {
          isValidPrescription: false,

          rejectionReason:
            'The AI vision service could not analyze this image. Please try again with a clear prescription image.'
        };

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

      if (
        parsed.isValidPrescription === false
      ) {

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

            return (
              name.length > 1 &&
              confidence >= 0.70
            );

          })
          .map((medicine) => ({

            name:
              String(
                medicine.name
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

        instructions:
          validMedicines[0].instructions ||
          'Follow the prescription.',

        confidenceScore:
          validMedicines[0].confidence,

        aiModelUsed:
          `Gemini Vision (${GEMINI_MODEL})`

      };


    } catch (error) {

      clearTimeout(geminiTimeout);

      // Gemini timed out — return a clear, user-facing rejection
      // so the frontend can show a helpful message rather than a
      // raw "signal is aborted without reason" browser error.
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.warn('Gemini Vision API timed out after 60s.');
        return {
          isValidPrescription: false,
          medicines: [],
          rejectionReason:
            'The AI vision service took too long to respond. Please try again in a moment.'
        };
      }

      console.error(
        'Prescription AI error:',
        error
      );

      return {

        isValidPrescription:
          false,

        medicines: [],

        rejectionReason:
          'Unable to analyze the prescription image. Please try again with a clear image.'

      };

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
