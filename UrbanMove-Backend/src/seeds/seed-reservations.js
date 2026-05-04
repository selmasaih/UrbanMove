/**
 * Script pour ajouter des réservations supplémentaires à Atlas
 * pour enrichir les données IoT dashboard
 * Exécuter avec: node src/seeds/seed-reservations.js
 */

require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Parking = require('../models/Parking');
const Reservation = require('../models/Reservation');

async function seedReservations() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ Connecté');

    // Récupérer le user demo et les parkings
    const user = await User.findOne({ email: 'demo@urbanmove.ma' });
    if (!user) {
      console.error('❌ User demo non trouvé. Lancez d\'abord node src/seeds/seed.js');
      process.exit(1);
    }

    const parkings = await Parking.find({ isActive: true });
    console.log(`Found ${parkings.length} parkings, user: ${user.firstName}`);

    // Supprimer les anciennes réservations pour repartir proprement
    const delCount = await Reservation.countDocuments({});
    console.log(`Réservations existantes: ${delCount}`);

    const vehicles = [
      { brand: 'Dacia', model: 'Logan', licensePlate: '12345-A-1', type: 'sedan' },
      { brand: 'Renault', model: 'Clio', licensePlate: '67890-B-2', type: 'sedan' },
      { brand: 'Peugeot', model: '208', licensePlate: '11223-C-3', type: 'compact' },
      { brand: 'Hyundai', model: 'Tucson', licensePlate: '44556-D-4', type: 'suv' },
      { brand: 'Toyota', model: 'Yaris', licensePlate: '77889-E-5', type: 'compact' },
      { brand: 'Fiat', model: '500', licensePlate: '99001-F-6', type: 'compact' },
      { brand: 'Volkswagen', model: 'Golf', licensePlate: '22334-G-7', type: 'sedan' },
    ];

    const reservations = [];

    // Créer 120 réservations sur les 60 derniers jours
    for (let i = 0; i < 120; i++) {
      const parkingIdx = i % parkings.length;
      const parking = parkings[parkingIdx];
      const daysAgo = Math.floor(Math.random() * 60);
      const hourOfDay = 7 + Math.floor(Math.random() * 14); // 7h - 21h
      const startTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      startTime.setHours(hourOfDay, Math.floor(Math.random() * 60), 0, 0);
      
      const durations = [60, 90, 120, 180, 240, 360];
      const duration = durations[Math.floor(Math.random() * durations.length)];
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      const hourlyRate = parking.pricing?.hourly || 10;
      const amount = Math.round((duration / 60) * hourlyRate);
      
      let status;
      if (daysAgo === 0) {
        status = Math.random() > 0.5 ? 'active' : 'confirmed';
      } else {
        const r = Math.random();
        if (r > 0.9) status = 'cancelled';
        else status = 'completed';
      }

      const floor = parking.floors && parking.floors.length > 0
        ? parking.floors[Math.floor(Math.random() * parking.floors.length)].name
        : `Niveau ${1 + (i % 3)}`;

      reservations.push({
        user: user._id,
        parking: parking._id,
        vehicle: vehicles[i % vehicles.length],
        spotNumber: `${String.fromCharCode(65 + (i % 4))}${String(1 + (i % 30)).padStart(2, '0')}`,
        floor,
        startTime,
        endTime,
        duration,
        pricing: {
          hourlyRate,
          amount,
          currency: 'MAD',
          breakdown: { base: amount, serviceFee: Math.round(amount * 0.05), taxes: 0 },
        },
        payment: {
          method: ['wallet', 'card', 'wallet'][i % 3],
          status: status === 'cancelled' ? 'refunded' : 'paid',
          transactionId: `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          paidAt: startTime,
        },
        status,
        checkIn: (status === 'completed' || status === 'active') ? startTime : undefined,
        checkOut: status === 'completed' ? endTime : undefined,
        qrCode: crypto.randomBytes(16).toString('hex'),
        confirmationCode: `UM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      });
    }

    // Insert in batches to avoid issues
    const batchSize = 20;
    let inserted = 0;
    for (let i = 0; i < reservations.length; i += batchSize) {
      const batch = reservations.slice(i, i + batchSize);
      try {
        await Reservation.insertMany(batch, { ordered: false });
        inserted += batch.length;
      } catch (e) {
        // Some may fail due to duplicate qrCode, that's ok
        inserted += (batch.length - (e.writeErrors?.length || 0));
        console.log(`  Batch ${Math.floor(i / batchSize) + 1}: some duplicates skipped`);
      }
    }

    const totalCount = await Reservation.countDocuments({});
    console.log(`\n✅ ${inserted} nouvelles réservations insérées`);
    console.log(`📊 Total réservations en base: ${totalCount}`);
    console.log('🎉 Le dashboard IoT affichera maintenant des données enrichies!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seedReservations();
