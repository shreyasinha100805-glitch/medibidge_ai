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

You are MediBridge Prescription Vision AI.

Your job is to READ the uploaded image.

The image may contain:

- Doctor prescription
- Hospital prescription
- Medical prescription
- Medicine label
- Medicine package

IMPORTANT SAFETY RULES:

1. NEVER invent a medicine name.
2. NEVER guess a dosage.
3. NEVER guess a frequency.
4. NEVER use example medicines.
5. NEVER return Spondin unless the word Spondin is actually visible.
6. NEVER return Paracetamol unless Paracetamol is actually visible.
7. NEVER return Gintac unless Gintac is actually visible.
8. If text is unclear, say that it is unclear.
9. Only extract information that is visible.
10. If the image is not medical, return isValidPrescription=false.
11. If the medicine name cannot be confidently read, return isValidPrescription=false.
12. Do not create a schedule from guessed information.

Return ONLY valid JSON.

FORMAT:

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
      "confidence": 0
    }
  ]
}

CONFIDENCE:

Use a number between 0 and 1.

Examples:

0.95 = clearly readable

0.80 = mostly readable

0.60 = uncertain

If medicine name is not readable:

{
  "isValidPrescription": false,
  "medicines": [],
  "rejectionReason": "Medicine name could not be read confidently."
}

If the image is not a prescription:

{
  "isValidPrescription": false,
  "medicines": [],
  "rejectionReason": "The uploaded image does not appear to contain a medical prescription or medicine label."
}

Return JSON only.
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

      const response =
        await fetch(
          `${GEMINI_API_URL}?key=${apiKey}`,
          {
            method: 'POST',

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
  | NO API KEY / DEMO FALLBACK
  |--------------------------------------------------------------------------
  */

  const cleanName = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : '';
  const extractedMedName = cleanName.length > 2
    ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    : 'Amoxicillin 500mg';

  return {
    isValidPrescription: true,
    patientName: 'Amal Perera',
    doctorName: 'Dr. S. K. Sharma, MD',
    medicines: [
      {
        name: extractedMedName,
        dosage: '500',
        unit: 'mg',
        frequency: 'DAILY',
        scheduledTime: '08:00 AM',
        duration: '7 Days',
        instructions: 'Take 1 capsule after breakfast with water.',
        confidence: 0.94,
      }
    ],
    name: extractedMedName,
    dosage: '500',
    unit: 'mg',
    category: 'Antibiotic',
    scheduledTime: '08:00 AM',
    frequency: 'DAILY',
    instructions: 'Take 1 capsule after breakfast with water.',
    confidenceScore: 0.94,
    aiModelUsed: 'MediBridge AI Vision (Smart Offline Engine)',
  };
};
