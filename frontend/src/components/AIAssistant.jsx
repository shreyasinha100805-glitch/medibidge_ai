import React, {
  useState,
  useRef
} from 'react';

import {
  IconBrain,
  IconSparkles,
  IconCamera,
  IconCheckCircle
} from './Icons';

import {
  scanPrescriptionImageAPI
} from '../api';


export const AIAssistant = ({
  onAskAI,
  history = [],
  onAddMedicine,
  showToast,
  onBack
}) => {

  const normalizeFrequency = (frequency) => {
    const validFrequencies = [
      'DAILY',
      'ALTERNATE_DAYS',
      'WEEKLY',
      'AS_NEEDED'
    ];

    return validFrequencies.includes(frequency)
      ? frequency
      : undefined;
  };

  const normalizeCategory = (category) => {
    const validCategories = [
      'Vitamin',
      'Antibiotic',
      'Painkiller',
      'Chronic',
      'Supplement',
      'Other'
    ];

    return validCategories.includes(category)
      ? category
      : 'Other';
  };

  const [question, setQuestion] =
    useState('');

  const [chatLogs, setChatLogs] =
    useState(history);

  const [isAsking, setIsAsking] =
    useState(false);

  const [isScanningImage, setIsScanningImage] =
    useState(false);

  const fileInputRef =
    useRef(null);


  const samplePrompts = [

    "📷 Scan prescription image & build schedule",

    "Why did my adherence drop this week?",

    "Which medicine do I miss most often?",

    "Give me a daily routine tip to improve evening doses.",

    "Summarize my overall 30-day medication adherence."

  ];


  /*
  |--------------------------------------------------------------------------
  | SEND AI QUESTION
  |--------------------------------------------------------------------------
  */

  const handleSend = async (
    qText
  ) => {

    const query =
      qText || question;


    if (
      !query.trim() ||
      isAsking
    ) {
      return;
    }


    if (
      query.includes(
        '📷 Scan prescription'
      ) ||
      query.includes(
        'Scan prescription image'
      )
    ) {

      fileInputRef.current?.click();

      return;

    }


    setIsAsking(true);


    const userMsg = {

      role: 'user',

      text: query,

      id: Date.now()

    };


    setChatLogs(
      prev => [
        ...prev,
        userMsg
      ]
    );


    setQuestion('');


    try {

      const res =
        await onAskAI(query);


      const aiMsg = {

        role: 'ai',

        text:
          res.data.response,

        id:
          Date.now() + 1,

        contextSummary:
          res.data.contextSummary

      };


      setChatLogs(
        prev => [
          ...prev,
          aiMsg
        ]
      );


    } catch (error) {

      setChatLogs(
        prev => [

          ...prev,

          {

            role: 'ai',

            text:
              `⚠️ ${error.message || 'Unable to contact MediBridge AI.'}`,

            id:
              Date.now() + 1

          }

        ]
      );

    } finally {

      setIsAsking(false);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | PRESCRIPTION IMAGE UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleDirectImageUpload =
    (event) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATE IMAGE
      |--------------------------------------------------------------------------
      */

      const allowedTypes = [

        'image/jpeg',

        'image/jpg',

        'image/png',

        'image/webp'

      ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        const message = {

          role: 'ai',

          text:
            '⚠️ Please upload a JPG, PNG or WEBP image.',

          id:
            Date.now()

        };


        setChatLogs(
          prev => [
            ...prev,
            message
          ]
        );


        event.target.value = '';

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | FILE SIZE
      |--------------------------------------------------------------------------
      */

      const maxSize =
        10 * 1024 * 1024;


      if (
        file.size > maxSize
      ) {

        const message = {

          role: 'ai',

          text:
            '⚠️ Image is too large. Please upload an image smaller than 10 MB.',

          id:
            Date.now()

        };


        setChatLogs(
          prev => [
            ...prev,
            message
          ]
        );


        event.target.value = '';

        return;

      }


      const reader =
        new FileReader();


      reader.onloadend =
        async () => {

          const base64 =
            reader.result;


          setIsScanningImage(
            true
          );


          const userMsg = {

            role: 'user',

            text:
              `Uploaded prescription [${file.name}] for AI analysis.`,

            imagePreview:
              base64,

            id:
              Date.now()

          };


          setChatLogs(
            prev => [
              ...prev,
              userMsg
            ]
          );


          try {

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT FIX
            |--------------------------------------------------------------------------
            |
            | Do NOT use:
            |
            | 'image/jpeg'
            |
            | Use the actual uploaded file MIME type.
            |
            */

            const scanRes =
              await scanPrescriptionImageAPI(
                base64,
                file.type,
                file.name
              );


            const pData =
              scanRes?.data?.prescription;


            /*
            |--------------------------------------------------------------------------
            | VALIDATE RESPONSE
            |--------------------------------------------------------------------------
            */

            if (
              !pData ||
              pData.isValidPrescription === false
            ) {

              throw new Error(

                pData?.rejectionReason ||

                'The uploaded image could not be identified as a valid prescription.'

              );

            }


            /*
            |--------------------------------------------------------------------------
            | CHECK MEDICINES
            |--------------------------------------------------------------------------
            */

            const medicines =
              Array.isArray(
                pData.medicines
              )
                ? pData.medicines
                : [];


            if (
              medicines.length === 0
            ) {

              throw new Error(
                'No medicine could be confidently identified. Please upload a clearer prescription.'
              );

            }


            /*
            |--------------------------------------------------------------------------
            | BUILD AI MESSAGE
            |--------------------------------------------------------------------------
            */

            const medicineText =
              medicines
                .map(
                  (medicine, index) => {

                    return (

                      `${index + 1}. ` +

                      `**${medicine.name}**` +

                      `${medicine.dosage ? ` — ${medicine.dosage}` : ''}` +

                      `${medicine.unit ? ` ${medicine.unit}` : ''}` +

                      `${medicine.frequency ? ` — ${medicine.frequency}` : ''}` +

                      `${medicine.scheduledTime ? ` — ${medicine.scheduledTime}` : ''}`

                    );

                  }
                )
                .join('\n');


            const firstMedicine =
              medicines[0];


            const confidence =
              Number(
                firstMedicine.confidence ||
                pData.confidenceScore ||
                0
              );


            const aiAdvice =

              `### 🩺 Prescription Analysis\n\n` +

              `**AI model:** ${pData.aiModelUsed || 'Gemini Vision'}\n\n` +

              `**Confidence:** ${(confidence * 100).toFixed(0)}%\n\n` +

              `### Detected Medicines\n\n` +

              medicineText +

              `\n\n` +

              `⚠️ Please verify the extracted information against the original prescription before adding it to your schedule.`;


            const aiMsg = {

              role: 'ai',

              text:
                aiAdvice,

              id:
                Date.now() + 1,

              prescriptionCard: {

                ...firstMedicine,

                category:
                  pData.category ||
                  'Prescription',

                added:
                  false

              },

              medicines

            };


            setChatLogs(
              prev => [
                ...prev,
                aiMsg
              ]
            );


            if (showToast) {

              showToast(
                '✅ Prescription analyzed successfully.',
                'success'
              );

            }


          } catch (error) {

            const errorMessage =
              error.message ||
              'Unable to analyze this prescription.';


            setChatLogs(
              prev => [

                ...prev,

                {

                  role: 'ai',

                  text:
                    `⚠️ **Prescription Scanner**\n\n${errorMessage}\n\nPlease upload a clear image where the medicine name and dosage are readable.`,

                  id:
                    Date.now() + 1

                }

              ]
            );


            if (showToast) {

              showToast(
                errorMessage,
                'error'
              );

            }

          } finally {

            setIsScanningImage(
              false
            );

            /*
            | Allow selecting the same file again.
            */

            event.target.value = '';

          }

        };


      reader.onerror =
        () => {

          setIsScanningImage(
            false
          );


          setChatLogs(
            prev => [

              ...prev,

              {

                role: 'ai',

                text:
                  '⚠️ Could not read the selected image.',

                id:
                  Date.now()

              }

            ]
          );

        };


      reader.readAsDataURL(
        file
      );

    };


  /*
  |--------------------------------------------------------------------------
  | ADD MEDICINE TO SCHEDULE
  |--------------------------------------------------------------------------
  */

  const handleAddScheduleFromChat =
    async (
      msgId,
      pData
    ) => {

      if (
        !onAddMedicine
      ) {

        return;

      }


      if (
        !pData?.name
      ) {

        if (showToast) {

          showToast(
            'Medicine name is missing.',
            'error'
          );

        }

        return;

      }


      try {

        await onAddMedicine({

          name:
            pData.name,

          dosage:
            pData.dosage,

          unit:
            pData.unit,

          category:
            normalizeCategory(
              pData.category
            ),

          scheduledTime:
            pData.scheduledTime ||
            '',

          frequency:
            normalizeFrequency(
              pData.frequency
            ),

          instructions:
            pData.instructions ||
            'Follow the doctor prescription.'

        });


        setChatLogs(
          prev =>

            prev.map(
              msg => {

                if (
                  msg.id === msgId &&
                  msg.prescriptionCard
                ) {

                  return {

                    ...msg,

                    prescriptionCard: {

                      ...msg.prescriptionCard,

                      added: true

                    }

                  };

                }


                return msg;

              }
            )

        );


        if (showToast) {

          showToast(
            `✓ ${pData.name} added to your schedule.`,
            'success'
          );

        }


      } catch (error) {

        if (showToast) {

          showToast(
            error.message ||
              'Failed to add medicine.',
            'error'
          );

        }

      }

    };


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '2rem 1.5rem'
      }}
    >

      {/* FILE INPUT */}

      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={
          handleDirectImageUpload
        }
        style={{
          display: 'none'
        }}
      />


      {/* BACK */}

      {onBack && (

        <button
          onClick={onBack}
          className="btn-ghost"
          style={{
            marginBottom:
              '1rem',
            padding:
              '0.5rem 1rem'
          }}
        >

          ← Back to Dashboard

        </button>

      )}


      {/* HEADER */}

      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom:
            '1.5rem',
          border:
            '1px solid rgba(139,92,246,.4)',
          background:
            'rgba(15,23,42,.85)'
        }}
      >

        <div
          style={{
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'space-between',
            gap:
              '1rem',
            flexWrap:
              'wrap'
          }}
        >

          <div
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap:
                '1rem'
            }}
          >

            <div
              style={{
                background:
                  'linear-gradient(135deg,#8b5cf6,#ec4899)',
                width:
                  '56px',
                height:
                  '56px',
                borderRadius:
                  '18px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center'
              }}
            >

              <IconBrain
                className="w-8 h-8"
                color="#ffffff"
              />

            </div>


            <div>

              <h2
                style={{
                  fontSize:
                    '2rem',
                  fontWeight:
                    900
                }}
              >
                MediBridge AI Health Assistant
              </h2>


              <p
                style={{
                  color:
                    '#94a3b8'
                }}
              >
                AI adherence assistant and prescription vision scanner.
              </p>

            </div>

          </div>


          <button
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="btn-purple"
          >

            <IconCamera
              className="w-5 h-5"
              color="#ffffff"
            />

            Scan Prescription

          </button>

        </div>

      </div>


      {/* QUICK PROMPTS */}

      <div
        style={{
          marginBottom:
            '1.5rem'
        }}
      >

        {samplePrompts.map(
          (
            prompt,
            index
          ) => (

            <button
              key={index}
              onClick={() =>
                handleSend(prompt)
              }
              style={{
                margin:
                  '0.3rem',
                padding:
                  '0.6rem 1rem',
                borderRadius:
                  '999px',
                border:
                  '1px solid rgba(139,92,246,.4)',
                background:
                  'rgba(139,92,246,.12)',
                color:
                  '#c4b5fd',
                cursor:
                  'pointer'
              }}
            >

              {prompt}

            </button>

          )
        )}

      </div>


      {/* CHAT */}

      <div
        className="glass-panel"
        style={{
          padding:
            '1.5rem',
          minHeight:
            '450px'
        }}
      >

        <div
          style={{
            display:
              'flex',
            flexDirection:
              'column',
            gap:
              '1rem',
            maxHeight:
              '540px',
            overflowY:
              'auto'
          }}
        >

          {chatLogs.length === 0 && (

            <div
              style={{
                textAlign:
                  'center',
                padding:
                  '4rem 1rem'
              }}
            >

              <IconSparkles
                className="w-12 h-12"
                color="#8b5cf6"
              />

              <h3>
                Ask MediBridge AI
              </h3>

              <p>
                Upload a prescription to automatically extract medicines.
              </p>

            </div>

          )}


          {chatLogs.map(
            msg => (

              <div
                key={msg.id}
                style={{
                  maxWidth:
                    '90%',
                  alignSelf:
                    msg.role === 'user'
                      ? 'flex-end'
                      : 'flex-start',
                  background:
                    msg.role === 'user'
                      ? 'linear-gradient(135deg,#06b6d4,#10b981)'
                      : 'rgba(255,255,255,.05)',
                  padding:
                    '1.2rem',
                  borderRadius:
                    '18px'
                }}
              >

                <strong>

                  {msg.role === 'user'
                    ? 'You'
                    : 'MediBridge AI'}

                </strong>


                {msg.imagePreview && (

                  <div
                    style={{
                      marginTop:
                        '0.8rem'
                    }}
                  >

                    <img
                      src={
                        msg.imagePreview
                      }
                      alt="Prescription"
                      style={{
                        maxWidth:
                          '100%',
                        maxHeight:
                          '250px',
                        borderRadius:
                          '10px'
                      }}
                    />

                  </div>

                )}


                <div
                  style={{
                    marginTop:
                      '0.7rem',
                    whiteSpace:
                      'pre-line',
                    lineHeight:
                      1.6
                  }}
                >

                  {msg.text}

                </div>


                {/* SCHEDULE CARD */}

                {msg.prescriptionCard && (

                  <div
                    style={{
                      marginTop:
                        '1rem',
                      padding:
                        '1rem',
                      borderRadius:
                        '12px',
                      background:
                        'rgba(16,185,129,.1)',
                      border:
                        '1px solid rgba(16,185,129,.3)'
                    }}
                  >

                    <strong>
                      📋 Schedule
                    </strong>


                    <p>

                      <strong>
                        {msg.prescriptionCard.name}
                      </strong>

                      {' '}

                      {msg.prescriptionCard.dosage}

                      {' '}

                      {msg.prescriptionCard.unit}

                    </p>


                    {msg.prescriptionCard.scheduledTime && (

                      <p>

                        ⏰

                        {' '}

                        {msg.prescriptionCard.scheduledTime}

                      </p>

                    )}


                    <p>

                      Confidence:

                      {' '}

                      {(
                        Number(
                          msg.prescriptionCard.confidence ||
                          0
                        ) * 100
                      ).toFixed(0)}

                      %

                    </p>


                    {!msg.prescriptionCard.added ? (

                      <button
                        onClick={() =>
                          handleAddScheduleFromChat(
                            msg.id,
                            msg.prescriptionCard
                          )
                        }
                        className="btn-primary"
                        style={{
                          width:
                            '100%',
                          padding:
                            '0.7rem'
                        }}
                      >

                        <IconCheckCircle
                          className="w-4 h-4"
                          color="#ffffff"
                        />

                        ⚡ Confirm & Add to Schedule

                      </button>

                    ) : (

                      <div
                        style={{
                          padding:
                            '0.7rem',
                          textAlign:
                            'center',
                          color:
                            '#34d399',
                          fontWeight:
                            800
                        }}
                      >

                        ✓ Added to schedule

                      </div>

                    )}

                  </div>

                )}

              </div>

            )
          )}


          {(isAsking ||
            isScanningImage) && (

            <div
              style={{
                color:
                  '#c4b5fd',
                fontWeight:
                  700
              }}
            >

              ✨

              {' '}

              {isScanningImage
                ? 'Analyzing prescription image...'
                : 'MediBridge AI is thinking...'}

            </div>

          )}

        </div>


        {/* INPUT */}

        <div
          style={{
            display:
              'flex',
            gap:
              '0.7rem',
            marginTop:
              '1.5rem'
          }}
        >

          <button
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="btn-purple"
          >

            📷

          </button>


          <input
            type="text"
            value={question}
            onChange={
              e =>
                setQuestion(
                  e.target.value
                )
            }
            onKeyDown={
              e => {

                if (
                  e.key === 'Enter'
                ) {

                  handleSend();

                }

              }
            }
            placeholder="Ask MediBridge AI..."
            style={{
              flex:
                1,
              padding:
                '1rem',
              borderRadius:
                '12px'
            }}
          />


          <button
            onClick={() =>
              handleSend()
            }
            disabled={
              isAsking ||
              isScanningImage ||
              !question.trim()
            }
            className="btn-purple"
          >

            Ask AI

          </button>

        </div>

      </div>


      {/* DISCLAIMER */}

      <div
        style={{
          textAlign:
            'center',
          marginTop:
            '1.5rem',
          color:
            '#64748b',
          fontSize:
            '0.8rem'
        }}
      >

        MediBridge AI provides adherence support and
        prescription extraction assistance. It does not
        replace a doctor or pharmacist.

      </div>

    </div>

  );

};
