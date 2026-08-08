/**
 * Demo Seed Script for MediBridge AI
 * ------------------------------------
 * Creates:
 *  - 1 demo patient (Amal)
 *  - 1 demo caretaker (Nimani)
 *  - An ACCEPTED caretaker connection between them
 *  - 3 medicines (Gintac, Paracetamol, Vitamin D)
 *  - 7 days of realistic MedicationLog history with a mix of
 *    TAKEN / MISSED / PENDING statuses so charts, adherence %,
 *    and AI insights all have real data to work with.
 *
 * Run with: npm run seed
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import MedicationLog from '../models/MedicationLog.js';
import CaretakerConnection from '../models/CaretakerConnection.js';
import Notification from '../models/Notification.js';

dotenv.config();

// ---- helpers ----------------------------------------------------------

/** Combine a JS Date (day) with an "HH:mm" scheduledTime string */
function combineDateAndTime(date, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const seedDatabase = async () => {
  await connectDB();

  console.log('🌱 Starting seed...');

  // ---- 1. Clear existing demo data --------------------------------
  await Promise.all([
    User.deleteMany({ email: { $in: ['amal@demo.com', 'nimani@demo.com'] } }),
  ]);

  const existingAmal = await User.findOne({ email: 'amal@demo.com' });
  if (existingAmal) {
    await Medicine.deleteMany({ patientId: existingAmal._id });
    await MedicationLog.deleteMany({ patientId: existingAmal._id });
    await CaretakerConnection.deleteMany({ patientId: existingAmal._id });
    await Notification.deleteMany({ userId: existingAmal._id });
  }

  // ---- 2. Create demo users ----------------------------------------
  const amal = await User.create({
    name: 'Amal',
    email: 'amal@demo.com',
    password: 'Demo@123', // hashed automatically via pre-save hook
    role: 'PATIENT',
  });

  const nimani = await User.create({
    name: 'Nimani',
    email: 'nimani@demo.com',
    password: 'Demo@123',
    role: 'CARETAKER',
  });

  console.log(`👤 Created patient: ${amal.name} (${amal.email})`);
  console.log(`👤 Created caretaker: ${nimani.name} (${nimani.email})`);

  // ---- 3. Connect patient <-> caretaker -----------------------------
  await CaretakerConnection.create({
    patientId: amal._id,
    caretakerId: nimani._id,
    status: 'ACCEPTED',
  });
  console.log('🔗 Linked Amal <-> Nimani (ACCEPTED)');

  // ---- 4. Create medicines -------------------------------------------
  const medicines = await Medicine.insertMany([
    {
      patientId: amal._id,
      name: 'Gintac',
      dosage: 1,
      unit: 'tablet',
      category: 'Chronic',
      scheduledTime: '20:00', // 8:00 PM
      frequency: 'DAILY',
      startDate: daysAgo(10),
      endDate: null,
      instructions: 'Take after dinner',
    },
    {
      patientId: amal._id,
      name: 'Paracetamol',
      dosage: 500,
      unit: 'mg',
      category: 'Painkiller',
      scheduledTime: '14:00', // 2:00 PM
      frequency: 'DAILY',
      startDate: daysAgo(10),
      endDate: null,
      instructions: 'Take with water after lunch',
    },
    {
      patientId: amal._id,
      name: 'Vitamin D',
      dosage: 1,
      unit: 'tablet',
      category: 'Vitamin',
      scheduledTime: '08:00', // 8:00 AM
      frequency: 'DAILY',
      startDate: daysAgo(10),
      endDate: null,
      instructions: 'Take with breakfast',
    },
  ]);

  const [gintac, paracetamol, vitaminD] = medicines;
  console.log(`💊 Created ${medicines.length} medicines: Gintac, Paracetamol, Vitamin D`);

  // ---- 5. Generate 7 days of realistic logs --------------------------
  // Pattern designed to tell a clear "story" for the AI + charts:
  //   - Vitamin D (morning): almost always taken -> good habit
  //   - Paracetamol (afternoon): occasionally missed
  //   - Gintac (evening): frequently missed -> the "declining adherence" story
  //
  // Day 0 = today (partially in the future -> PENDING), Day 1-6 = past (complete)

  const logs = [];

  // past 6 days (fully in the past -> TAKEN or MISSED only)
  for (let dayOffset = 6; dayOffset >= 1; dayOffset--) {
    const day = daysAgo(dayOffset);

    // Vitamin D: taken 6/6 days (great adherence)
    logs.push(buildLog(vitaminD, amal, day, true));

    // Paracetamol: missed on day offsets 5 and 2 (2 misses out of 6)
    const paracetamolTaken = !(dayOffset === 5 || dayOffset === 2);
    logs.push(buildLog(paracetamol, amal, day, paracetamolTaken));

    // Gintac: missed on day offsets 6,4,3,1 (4 misses out of 6) -> declining trend, evening pattern
    const gintacTaken = !(dayOffset === 6 || dayOffset === 4 || dayOffset === 3 || dayOffset === 1);
    logs.push(buildLog(gintac, amal, day, gintacTaken));
  }

  // Today (day 0): morning + afternoon already happened, evening still pending
  const today = new Date();
  logs.push(buildLog(vitaminD, amal, today, true)); // taken this morning
  logs.push(buildLog(paracetamol, amal, today, true)); // taken this afternoon

  // Gintac tonight: still PENDING (scheduled time may be in future) — this is what
  // the "mark as taken" / "simulate missed" demo buttons will act on live.
  const gintacScheduledToday = combineDateAndTime(today, gintac.scheduledTime);
  logs.push({
    medicineId: gintac._id,
    patientId: amal._id,
    scheduledTime: gintacScheduledToday,
    status: 'PENDING',
    takenAt: null,
    missedAt: null,
  });

  await MedicationLog.insertMany(logs);
  console.log(`📋 Created ${logs.length} medication logs across 7 days`);

  // ---- 6. Seed a couple of notifications -----------------------------
  await Notification.insertMany([
    {
      userId: amal._id,
      type: 'MEDICINE_MISSED',
      title: 'Medication Missed',
      message: 'You missed Gintac scheduled at 8:00 PM.',
      read: false,
    },
    {
      userId: nimani._id,
      type: 'MEDICINE_MISSED',
      title: 'Patient Alert',
      message: 'Amal missed Gintac scheduled at 8:00 PM.',
      read: false,
    },
    {
      userId: nimani._id,
      type: 'ADHERENCE_ALERT',
      title: 'Adherence Declining',
      message: "Amal's adherence has decreased this week, mostly in evening doses.",
      read: false,
    },
  ]);
  console.log('🔔 Created demo notifications');

  console.log('\n✅ Seed complete!\n');
  console.log('----------------------------------------');
  console.log('DEMO CREDENTIALS');
  console.log('----------------------------------------');
  console.log('Patient   -> amal@demo.com   / Demo@123');
  console.log('Caretaker -> nimani@demo.com / Demo@123');
  console.log('----------------------------------------\n');

  await mongoose.connection.close();
  process.exit(0);
};

/** Build a completed (TAKEN or MISSED) log entry for a given medicine/day */
function buildLog(medicine, patient, day, wasTaken) {
  const scheduledTime = combineDateAndTime(day, medicine.scheduledTime);
  if (wasTaken) {
    // "taken" a few minutes after scheduled time, feels realistic
    const takenAt = new Date(scheduledTime.getTime() + 5 * 60000);
    return {
      medicineId: medicine._id,
      patientId: patient._id,
      scheduledTime,
      status: 'TAKEN',
      takenAt,
      missedAt: null,
    };
  }
  return {
    medicineId: medicine._id,
    patientId: patient._id,
    scheduledTime,
    status: 'MISSED',
    takenAt: null,
    missedAt: new Date(scheduledTime.getTime() + 60 * 60000), // marked missed 1hr later
  };
}

seedDatabase().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
