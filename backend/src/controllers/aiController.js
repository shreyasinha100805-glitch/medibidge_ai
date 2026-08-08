import AIInteraction from '../models/AIInteraction.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildPatientAIContext, generateAIResponse, scanPrescriptionImage } from '../services/aiService.js';

export const askAssistant = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new ApiError(400, 'Please provide a valid question for the AI assistant.');
  }

  const patientId = req.user._id;

  // Build context from MongoDB data
  const context = await buildPatientAIContext(patientId);

  // Generate response via Gemini or intelligent fallback
  const responseText = await generateAIResponse(question.trim(), context);

  // Record interaction for audit and history UI
  const interaction = await AIInteraction.create({
    userId: patientId,
    question: question.trim(),
    response: responseText,
  });

  res.status(200).json({
    success: true,
    data: {
      interactionId: interaction._id,
      question: interaction.question,
      response: interaction.response,
      createdAt: interaction.createdAt,
      contextSummary: {
        adherencePercent: context.adherenceMonthPercent,
        activeMedicinesCount: context.medicinesCount,
        lowestAdherenceMed: context.lowestAdherenceMed,
      },
    },
  });
});

export const getAIHistory = asyncHandler(async (req, res) => {
  const interactions = await AIInteraction.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  res.status(200).json({
    success: true,
    data: { interactions },
  });
});

export const scanPrescription = asyncHandler(async (req, res) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    throw new ApiError(400, 'Please provide a prescription image (base64).');
  }

  const result = await scanPrescriptionImage(imageBase64, mimeType || 'image/jpeg');

  res.status(200).json({
    success: true,
    message: 'Prescription image analyzed successfully by MediBridge AI.',
    data: { prescription: result },
  });
});
