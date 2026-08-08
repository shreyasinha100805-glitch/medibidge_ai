import Notification from '../models/Notification.js';
import CaretakerConnection from '../models/CaretakerConnection.js';

export async function createNotification({ userId, type, title, message }) {
  return Notification.create({ userId, type, title, message });
}

export async function notifyMissedDose({ patientId, patientName, medicineName, scheduledTime }) {
  const timeStr = scheduledTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  await createNotification({
    userId: patientId,
    type: 'MEDICINE_MISSED',
    title: 'Medication Missed',
    message: `Medication missed: ${medicineName} at ${timeStr}.`,
  });

  const connections = await CaretakerConnection.find({ patientId, status: 'ACCEPTED' });

  await Promise.all(
    connections.map((conn) =>
      createNotification({
        userId: conn.caretakerId,
        type: 'MEDICINE_MISSED',
        title: 'Patient Alert',
        message: `${patientName} missed ${medicineName} scheduled at ${timeStr}.`,
      })
    )
  );
}

export async function notifyTaken({ patientId, medicineName, takenAt }) {
  const timeStr = takenAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  await createNotification({
    userId: patientId,
    type: 'MEDICINE_TAKEN',
    title: 'Medication Taken',
    message: `${medicineName} marked as taken at ${timeStr}.`,
  });
}