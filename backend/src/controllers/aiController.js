import AIInteraction from '../models/AIInteraction.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildPatientAIContext, generateAIResponse, scanPrescriptionImage } from '../services/aiService.js';

export const askAssistant = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { question } = body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new ApiError(400, 'Please provide a valid question for the AI assistant.');
  }

  const patientId = req.user._id;

  // Build context from MongoDB data
  const context = await buildPatientAIContext(patientId, req.user.timeZone || 'UTC');

  // Generate a Gemini response or return a service error.
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
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const { imageBase64, mimeType, fileName } = body;

  if (!imageBase64) {
    throw new ApiError(400, 'Please provide a prescription image (base64).');
  }

  const result = await scanPrescriptionImage(imageBase64, mimeType, fileName || '');

  if (result.isValidPrescription === false) {
    throw new ApiError(400, result.rejectionReason || 'The uploaded photo does not contain a valid doctor prescription or pill label.');
  }

  res.status(200).json({
    success: true,
    message: 'Prescription image analyzed successfully by MediBridge AI.',
    data: { prescription: result },
  });
});
