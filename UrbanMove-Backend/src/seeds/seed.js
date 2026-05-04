/**
 * Script de seed pour peupler la base de données UrbanMove v2
 * Exécuter avec: node src/seeds/seed.js
 */

require('dotenv').config();

// Forcer Google DNS pour résoudre les problèmes réseau
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('../models/User');
const Parking = require('../models/Parking');
const Alert = require('../models/Alert');
const Review = require('../models/Review');
const Reservation = require('../models/Reservation');

// Données de démonstration — Vrais parkings avec coordonnées réelles
const parkingsData = [
  // ========================
  // RABAT (10 parkings réels)
  // ========================
  {
    name: 'Parking Agdal Center',
    description: 'Parking moderne au cœur de l\'Agdal avec surveillance 24h/24, à proximité des commerces et restaurants',
    type: 'underground',
    location: {
      type: 'Point',
      coordinates: [-6.8498, 33.9897],
    },
    address: {
      street: 'Avenue Ibn Sina, Agdal',
      city: 'Rabat',
      postalCode: '10080',
      country: 'Maroc',
    },
    totalSpots: 200,
    availableSpots: 45,
    floors: [
      { name: 'Niveau -1', totalSpots: 100, availableSpots: 20 },
      { name: 'Niveau -2', totalSpots: 100, availableSpots: 25 },
    ],
    pricing: { hourly: 10, daily: 60, monthly: 800, currency: 'MAD' },
    amenities: ['security', 'lighting', 'elevator', 'ev_charging', 'disabled_access'],
    operatingHours: { is24Hours: true },
    images: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400'],
    sensors: { hasSensors: true, provider: 'UrbanMove IoT' },
    rating: 4.5,
    reviewCount: 128,
  },
  {
    name: 'Parking Tour Hassan',
    description: 'Parking à proximité de la Tour Hassan et du Mausolée Mohammed V, idéal pour les visiteurs',
    type: 'outdoor',
    location: {
      type: 'Point',
      coordinates: [-6.8225, 34.0246],
    },
    address: {
      street: 'Boulevard Mohamed Lyazidi, Tour Hassan',
      city: 'Rabat',
      postalCode: '10020',
      country: 'Maroc',
    },
    totalSpots: 150,
    availableSpots: 32,
    floors: [
      { name: 'Niveau 0', totalSpots: 150, availableSpots: 32 },
    ],
    pricing: { hourly: 8, daily: 50, currency: 'MAD' },
    amenities: ['security', 'lighting'],
    operatingHours: {
      is24Hours: false,
      schedule: {
        monday: { open: '06:00', close: '22:00' },
        tuesday: { open: '06:00', close: '22:00' },
        wednesday: { open: '06:00', close: '22:00' },
        thursday: { open: '06:00', close: '22:00' },
        friday: { open: '06:00', close: '22:00' },
        saturday: { open: '06:00', close: '22:00' },
        sunday: { open: '06:00', close: '22:00' },
      },
    },
    images: ['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400'],
    sensors: { hasSensors: true, provider: 'UrbanMove IoT' },
    rating: 4.2,
    reviewCount: 89,
  },
  {
    name: 'Parking Mega Mall Rabat',
    description: 'Grand parking du centre commercial Mega Mall avec accès direct au mall',
    type: 'multilevel',
    location: {
      type: 'Point',
      coordinates: [-6.8667, 33.9575],
    },
    address: {
      street: 'Route de Zaërs, Souissi',
      city: 'Rabat',
      postalCode: '10100',
      country: 'Maroc',
    },
    totalSpots: 500,
    availableSpots: 120,
    floors: [
      { name: 'Niveau 0', totalSpots: 200, availableSpots: 50 },
      { name: 'Niveau 1', totalSpots: 150, availableSpots: 40 },
      { name: 'Niveau 2', totalSpots: 150, availableSpots: 30 },
    ],
    pricing: { hourly: 5, daily: 40, currency: 'MAD' },
    amenities: ['security', 'lighting', 'elevator', 'cctv', 'disabled_access', 'restrooms'],
    operatingHours: {
      is24Hours: false,
      schedule: {
        monday: { open: '09:00', close: '23:00' },
        tuesday: { open: '09:00', close: '23:00' },
        wednesday: { open: '09:00', close: '23:00' },
        thursday: { open: '09:00', close: '23:00' },
        friday: { open: '09:00', close: '23:00' },
        saturday: { open: '09:00', close: '23:00' },
        sunday: { open: '09:00', close: '23:00' },
      },
    },
    images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400'],
    sensors: { hasSensors: true, provider: 'UrbanMove IoT' },
    rating: 4.7,
    reviewCount: 256,
  },
  {
    name: 'Parking Al Irfane — INPT',
    description: 'Parking situé au quartier Al Irfane à côté de l\'INPT (Institut National des Postes et Télécommunications) et de l\'UIR',
    type: 'outdoor',
    location: {
      type: 'Point',
      coordinates: [-6.8890, 33.9632],
    },
    address: {
      street: 'Avenue Allal Al Fassi, Al Irfane',
      city: 'Rabat',
      postalCode: '10100',
      country: 'Maroc',
    },
    totalSpots: 180,
    availableSpots: 55,
    floors: [
      { name: 'Niveau 0', totalSpots: 180, availableSpots: 55 },
    ],
    pricing: { hourly: 5, daily: 30, currency: 'MAD' },
    amenities: ['security', 'lighting', 'cctv'],
    operatingHours: {
      is24Hours: false,
      schedule: {
        monday: { open: '07:00', close: '22:00' },
        tuesday: { open: '07:00', close: '22:00' },
        wednesday: { open: '07:00', close: '22:00' },
        thursday: { open: '07:00', close: '22:00' },
        friday: { open: '07:00', close: '22:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '08:00', close: '18:00' },
      },
    },
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    sensors: { hasSensors: true, provider: 'UrbanMove IoT' },
    rating: 4.0,
    reviewCount: 42,
  },
  {
    name: 'Parking Hay Riad',
    description: 'Parking sécurisé au cœur du quartier Hay Riad, à proximité des ministères et ambassades',
    type: 'outdoor',
    location: {
      type: 'Point',
      coordinates: [-6.8663, 33.9616],
    },
    address: {
      street: 'Avenue Annakhil, Hay Riad',
      city: 'Rabat',
      postalCode: '10100',
      country: 'Maroc',
    },
    totalSpots: 120,
    availableSpots: 38,
    floors: [
      { name: 'Niveau 0', totalSpots: 120, availableSpots: 38 },
    ],
    pricing: { hourly: 7, daily: 45, currency: 'MAD' },
    amenities: ['security', 'lighting', 'cctv', 'disabled_access'],
    operatingHours: { is24Hours: true },
    images: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400'],
    sensors: { hasSensors: true, provider: 'UrbanMove IoT' },
    rating: 4.3,
    reviewCount: 76,
  },
  {
    name: 'Parking Gare Rabat-Ville',
    description: 'Parking officiel de la gare ferroviaire Rabat-Ville, idéal pour les voyageurs',
    type: 'multilevel',
    location: {
      type: 'Point',
      coordinates: [-6.8355, 34.0128],
    },
    address: {
      street: 'Avenue Mohammed V, Centre-Ville',
      city: 'Rabat',
      postalCode: '10001',
      country: 'Maroc',
    },
    totalSpots: 250,
    availableSpots: 72,
    floors: [
      { name: 'Niveau -1', totalSpots: 130, availableSpots: 40 },
      { name: 'Niveau 0', totalSpots: 120, availableSpots: 32 },
    ],
    pricing: { hourly: 10, daily: 60, monthly: 700, currency: 'MAD' },
    amenities: ['security', 'lighting', 'elevator', 'cctv', 'disabled_access'],
    operatingHours: { is24Hours: true },
    images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400'],
    sensors: { hasSensors: true, provider: 'UrbanMove IoT' },
    rating: 4.4,
    reviewCount: 198,
  },
  {
    name: 'Parking Médina Rabat',
    description: 'Parking à l\'entrée de la Médina de Rabat, près de Bab El Had et du marché central',
    type: 'outdoor',
    location: {
      type: 'Point',
      coordinates: [-6.8345, 34.0178],
    },
    address: {
      street: 'Avenue Hassan II, Bab El Had',
      city: 'Rabat',
      postalCode: '10030',
      country: 'Maroc',
    },
    totalSpots: 100,
    availableSpots: 18,
    floors: [
      { name: 'Niveau 0', totalSpots: 100, availableSpots: 18 },
    ],
    pricing: { hourly: 5, daily: 30, currency: 'MAD' },
    amenities: ['security', 'lighting'],
    operatingHours: {
      is24Hours: false,
      schedule: {
        monday: { open: '06:00', close: '23:00' },
        tuesday: { open: '06:00', close: '23:00' },
        wednesday: { open: '06:00', close: '23:00' },
        thursday: { open: '06:00', close: '23:00' },
        friday: { open: '06:00', close: '23:00' },
        saturday: { open: '06:00', close: '23:00' },
        sunday: { open: '06:00', close: '23:00' },
      },
    },
    images: ['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400'],
    sensors: { hasSensors: false },
    rating: 3.8,
    reviewCount: 112,
  },
  {
    name: 'Parking CHU Ibn Sina',
    description: 'Parking de l\'Hôpital Universitaire Ibn Sina, réservé prioritairement aux patients et visiteurs',
    type: 'outdoor',
    location: {
      type: 'Point',
      coordinates: [-6.8462, 34.0031],
    },
    address: {
      street: 'Avenue Ibn Sina, Agdal',
      city: 'Rabat',
      postalCode: '10080',
      country: 'Maroc',
    },
    totalSpots: 300,
    availableSpots: 85,
    floors: [
      { name: 'Niveau 0', totalSpots: 300, availableSpots: 85 },
    ],
    pricing: { hourly: 5, daily: 30, currency: 'MAD' },
    amenities: ['security', 'lighting', 'disabled_access', 'cctv'],
    operatingHours: { is24Hours: true },
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    sensors: { hasSensors: true, provider: 'UrbanMove IoT' },
    rating: 3.5,
    reviewCount: 67,
  },
  {
    name: 'Parking Chellah',
    description: 'Parking touristique à proximité du site historique de Chellah et des jardins',
    type: 'outdoor',
    location: {
      type: 'Point',
      coordinates: [-6.8144, 34.0059],
    },
    address: {
      street: 'Avenue Yacoub El Mansour, Chellah',
      city: 'Rabat',
      postalCode: '10020',
      country: 'Maroc',
    },
    totalSpots: 80,
    availableSpots: 22,
    floors: [
      { name: 'Niveau 0', totalSpots: 80, availableSpots: 22 },
    ],
    pricing: { hourly: 5, daily: 25, currency: 'MAD' },
    amenities: ['security', 'lighting'],
    operatingHours: {
      is24Hours: false,
      schedule: {
        monday: { open: '07:00', close: '20:00' },
        tuesday: { open: '07:00', close: '20:00' },
        wednesday: { open: '07:00', close: '20:00' },
        thursday: { open: '07:00', close: '20:00' },
        friday: { open: '07:00', close: '20:00' },
        saturday: { open: '08:00', close: '19:00' },
        sunday: { open: '08:00', close: '19:00' },
      },
    },
    images: ['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400'],
    sensors: { hasSensors: false },
    rating: 4.1,
    reviewCount: 45,
  },
  {
    name: 'Parking Marjane Hay Riad',
    description: 'Parking du supermarché Marjane Hay Riad, gratuit pour les clients du magasin (2h)',
    type: 'outdoor',
    location: {
      type: 'Point',
      coordinates: [-6.8572, 33.9530],
    },
    address: {
      street: 'Avenue Annakhil, Hay Riad',
      city: 'Rabat',
      postalCode: '10100',
      country: 'Maroc',
    },
    totalSpots: 350,
    availableSpots: 95,
    floors: [
      { name: 'Niveau 0', totalSpots: 350, availableSpots: 95 },
    ],
    pricing: { hourly: 3, daily: 20, currency: 'MAD' },
    amenities: ['security', 'lighting', 'cctv', 'disabled_access', 'restrooms'],
    operatingHours: {
      is24Hours: false,
      schedule: {
        monday: { open: '08:00', close: '23:00' },
        tuesday: { open: '08:00', close: '23:00' },
        wednesday: { open: '08:00', close: '23:00' },
        thursday: { open: '08:00', close: '23:00' },
        friday: { open: '08:00', close: '23:00' },
        saturday: { open: '08:00', close: '23:00' },
        sunday: { open: '09:00', close: '22:00' },
      },
    },
    images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400'],
    sensors: { hasSensors: true, provider: 'UrbanMove IoT' },
    rating: 4.0,
    reviewCount: 134,
  },

  // ========================
  // CASABLANCA (3 parkings)
  // ========================
  {
    name: 'Parking Morocco Mall',
    description: 'Parking VIP du Morocco Mall avec services premium',
    type: 'underground',
    location: {
      type: 'Point',
      coordinates: [-7.6683, 33.5667],
    },
    address: {
      street: 'Boulevard de la Corniche',
      city: 'Casablanca',
      postalCode: '20000',
      country: 'Maroc',
    },
    totalSpots: 1000,
    availableSpots: 234,
    floors: [
      { name: 'Niveau -1', totalSpots: 400, availableSpots: 100 },
      { name: 'Niveau -2', totalSpots: 350, availableSpots: 84 },
      { name: 'Niveau -3', totalSpots: 250, availableSpots: 50 },
    ],
    pricing: {
      hourly: 15,
      daily: 100,
      monthly: 1200,
      currency: 'MAD',
    },
    amenities: ['security', 'lighting', 'elevator', 'ev_charging', 'disabled_access', 'cctv', 'car_wash', 'valet'],
    operatingHours: {
      is24Hours: true,
    },
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'],
    rating: 4.8,
    reviewCount: 512,
  },
  {
    name: 'Parking Twin Center',
    description: 'Parking d\'affaires au pied des Twin Towers',
    type: 'underground',
    location: {
      type: 'Point',
      coordinates: [-7.6192, 33.5883],
    },
    address: {
      street: 'Boulevard Zerktouni',
      city: 'Casablanca',
      postalCode: '20100',
      country: 'Maroc',
    },
    totalSpots: 400,
    availableSpots: 67,
    floors: [
      { name: 'Niveau -1', totalSpots: 200, availableSpots: 30 },
      { name: 'Niveau -2', totalSpots: 200, availableSpots: 37 },
    ],
    pricing: {
      hourly: 12,
      daily: 80,
      monthly: 1000,
      currency: 'MAD',
    },
    amenities: ['security', 'lighting', 'elevator', 'cctv', 'disabled_access'],
    operatingHours: {
      is24Hours: true,
    },
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    rating: 4.4,
    reviewCount: 178,
  },
  {
    name: 'Parking Maarif',
    description: 'Parking central du quartier Maarif',
    type: 'multilevel',
    location: {
      type: 'Point',
      coordinates: [-7.6350, 33.5750],
    },
    address: {
      street: 'Rue Imam Muslim',
      city: 'Casablanca',
      postalCode: '20100',
      country: 'Maroc',
    },
    totalSpots: 180,
    availableSpots: 23,
    floors: [
      { name: 'Niveau 0', totalSpots: 90, availableSpots: 10 },
      { name: 'Niveau 1', totalSpots: 90, availableSpots: 13 },
    ],
    pricing: {
      hourly: 8,
      daily: 50,
      currency: 'MAD',
    },
    amenities: ['security', 'lighting', 'cctv'],
    operatingHours: {
      is24Hours: false,
      schedule: {
        monday: { open: '07:00', close: '21:00' },
        tuesday: { open: '07:00', close: '21:00' },
        wednesday: { open: '07:00', close: '21:00' },
        thursday: { open: '07:00', close: '21:00' },
        friday: { open: '07:00', close: '21:00' },
        saturday: { open: '08:00', close: '22:00' },
        sunday: { open: '08:00', close: '20:00' },
      },
    },
    images: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400'],
    rating: 3.9,
    reviewCount: 67,
  },

  // ========================
  // TANGER (2 parkings)
  // ========================
  {
    name: 'Parking Tanger City Mall',
    description: 'Grand parking du centre commercial Tanger City Mall',
    type: 'underground',
    location: {
      type: 'Point',
      coordinates: [-5.7945, 35.7642],
    },
    address: {
      street: 'Route de Rabat',
      city: 'Tanger',
      postalCode: '90000',
      country: 'Maroc',
    },
    totalSpots: 600,
    availableSpots: 156,
    floors: [
      { name: 'Niveau -1', totalSpots: 300, availableSpots: 80 },
      { name: 'Niveau -2', totalSpots: 300, availableSpots: 76 },
    ],
    pricing: {
      hourly: 10,
      daily: 60,
      monthly: 700,
      currency: 'MAD',
    },
    amenities: ['security', 'lighting', 'elevator', 'ev_charging', 'disabled_access', 'cctv'],
    operatingHours: {
      is24Hours: true,
    },
    images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400'],
    rating: 4.6,
    reviewCount: 234,
  },
  {
    name: 'Parking Marina Bay',
    description: 'Parking avec vue sur la marina de Tanger',
    type: 'outdoor',
    location: {
      type: 'Point',
      coordinates: [-5.8123, 35.7867],
    },
    address: {
      street: 'Port de Tanger Ville',
      city: 'Tanger',
      postalCode: '90000',
      country: 'Maroc',
    },
    totalSpots: 100,
    availableSpots: 28,
    floors: [
      { name: 'Niveau 0', totalSpots: 100, availableSpots: 28 },
    ],
    pricing: {
      hourly: 6,
      daily: 40,
      currency: 'MAD',
    },
    amenities: ['security', 'lighting'],
    operatingHours: {
      is24Hours: true,
    },
    images: ['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400'],
    rating: 4.1,
    reviewCount: 89,
  },
];

const alertsData = [
  // RABAT
  {
    type: 'accident',
    title: 'Accident sur Avenue Mohammed V',
    description: 'Collision entre deux véhicules, voie de droite bloquée',
    location: {
      type: 'Point',
      coordinates: [-6.8401, 34.0132],
    },
    address: {
      street: 'Avenue Mohammed V',
      city: 'Rabat',
    },
    severity: 'high',
    source: 'authority',
  },
  {
    type: 'construction',
    title: 'Travaux Boulevard Hassan II',
    description: 'Travaux de réfection de la chaussée, circulation ralentie',
    location: {
      type: 'Point',
      coordinates: [-6.8356, 34.0178],
    },
    address: {
      street: 'Boulevard Hassan II',
      city: 'Rabat',
    },
    severity: 'medium',
    source: 'authority',
    estimatedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    type: 'traffic',
    title: 'Embouteillage Pont Hassan II',
    description: 'Trafic dense aux heures de pointe',
    location: {
      type: 'Point',
      coordinates: [-6.8234, 34.0298],
    },
    address: {
      street: 'Pont Hassan II',
      city: 'Rabat',
    },
    severity: 'medium',
    source: 'sensor',
  },

  // CASABLANCA
  {
    type: 'accident',
    title: 'Accident Boulevard de la Corniche',
    description: 'Véhicule en panne sur la voie rapide',
    location: {
      type: 'Point',
      coordinates: [-7.6523, 33.5934],
    },
    address: {
      street: 'Boulevard de la Corniche',
      city: 'Casablanca',
    },
    severity: 'medium',
    source: 'user',
  },
  {
    type: 'event',
    title: 'Match au Stade Mohammed V',
    description: 'Forte affluence attendue, prévoir des délais',
    location: {
      type: 'Point',
      coordinates: [-7.5956, 33.5731],
    },
    address: {
      street: 'Stade Mohammed V',
      city: 'Casablanca',
    },
    severity: 'low',
    source: 'authority',
  },
  {
    type: 'traffic',
    title: 'Congestion Centre-Ville',
    description: 'Trafic très dense dans le centre de Casablanca',
    location: {
      type: 'Point',
      coordinates: [-7.6145, 33.5883],
    },
    address: {
      street: 'Place Mohammed V',
      city: 'Casablanca',
    },
    severity: 'high',
    source: 'sensor',
  },

  // TANGER
  {
    type: 'construction',
    title: 'Travaux Autoroute Tanger-Med',
    description: 'Travaux d\'élargissement, vitesse réduite à 60 km/h',
    location: {
      type: 'Point',
      coordinates: [-5.7234, 35.8123],
    },
    address: {
      street: 'Autoroute A4',
      city: 'Tanger',
    },
    severity: 'medium',
    source: 'authority',
    estimatedEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    type: 'traffic',
    title: 'Embouteillage Port de Tanger',
    description: 'Attente importante pour le ferry',
    location: {
      type: 'Point',
      coordinates: [-5.8123, 35.7867],
    },
    address: {
      street: 'Port de Tanger Ville',
      city: 'Tanger',
    },
    severity: 'high',
    source: 'sensor',
  },
];

// Utilisateur de démonstration
const demoUser = {
  firstName: 'Ahmed',
  lastName: 'Bennani',
  email: 'demo@urbanmove.ma',
  password: 'demo123456',
  phone: '0612345678',
  city: 'rabat',
  isVerified: true,
  vehicles: [
    {
      brand: 'Dacia',
      model: 'Duster',
      licensePlate: '12345-A-1',
      type: 'car',
      color: 'Blanc',
      isElectric: false,
      isDefault: true,
    },
    {
      brand: 'Renault',
      model: 'Clio',
      licensePlate: '67890-B-2',
      type: 'car',
      color: 'Noir',
      isElectric: false,
      isDefault: false,
    },
  ],
  wallet: {
    balance: 250,
    currency: 'MAD',
    transactions: [
      {
        type: 'topup',
        amount: 200,
        description: 'Rechargement par carte bancaire',
        status: 'completed',
        reference: 'TOP-DEMO-001',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'topup',
        amount: 100,
        description: 'Rechargement par Cash Plus',
        status: 'completed',
        reference: 'TOP-DEMO-002',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'payment',
        amount: -50,
        description: 'Réservation Parking Agdal Center',
        status: 'completed',
        reference: 'RES-DEMO-001',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  },
  stats: {
    totalReservations: 15,
    alertsReported: 3,
    co2Saved: 2500,
    timeSaved: 180,
    totalSpent: 450,
  },
  favorites: {
    parkings: [],
    places: [
      {
        name: 'Maison',
        address: 'Hay Riad, Rabat',
        coordinates: { lat: 33.9716, lng: -6.8498 },
      },
      {
        name: 'Travail',
        address: 'Agdal, Rabat',
        coordinates: { lat: 33.9897, lng: -6.8498 },
      },
    ],
  },
  preferences: {
    notifications: { push: true, email: true, sms: false, alerts: true, reservations: true, promotions: false },
    language: 'fr',
    defaultCity: 'rabat',
    darkMode: false,
  },
};

// Admin de démonstration
const adminUser = {
  firstName: 'Admin',
  lastName: 'UrbanMove',
  email: 'admin@urbanmove.ma',
  password: 'admin123456',
  phone: '0600000000',
  city: 'rabat',
  role: 'admin',
  isVerified: true,
};

async function seed() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/urbanmove';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Nettoyer les collections existantes
    console.log('🗑️  Nettoyage des données existantes...');
    await Promise.all([
      User.deleteMany({}),
      Parking.deleteMany({}),
      Alert.deleteMany({}),
      Review.deleteMany({}),
      Reservation.deleteMany({}),
    ]);

    // Insérer les parkings
    console.log('🅿️  Insertion des parkings...');
    const parkings = await Parking.insertMany(parkingsData);
    console.log(`   ${parkings.length} parkings créés`);

    // Insérer les alertes
    console.log('⚠️  Insertion des alertes...');
    const alerts = await Alert.insertMany(alertsData);
    console.log(`   ${alerts.length} alertes créées`);

    // Créer les utilisateurs
    console.log('👤 Création des utilisateurs...');
    
    // Mettre les favoris de parkings pour le user demo
    demoUser.favorites.parkings = [parkings[0]._id, parkings[3]._id];
    
    const user = new User(demoUser);
    await user.save();

    const admin = new User(adminUser);
    await admin.save();

    console.log(`   2 utilisateurs créés`);

    // Créer des réservations de démo
    console.log('🎫 Création des réservations...');
    const crypto = require('crypto');
    const demoReservations = [
      {
        user: user._id,
        parking: parkings[0]._id,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        duration: 180,
        floor: 'Niveau -1',
        spotNumber: 'A42',
        spotType: 'standard',
        vehicle: { brand: 'Dacia', model: 'Duster', licensePlate: '12345-A-1', type: 'car' },
        pricing: { hourlyRate: 10, amount: 33, currency: 'MAD', breakdown: { base: 30, serviceFee: 2, taxes: 1 } },
        payment: { method: 'wallet', status: 'paid', paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        status: 'completed',
        confirmationCode: 'UM-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        qrCode: crypto.randomBytes(16).toString('hex'),
      },
      {
        user: user._id,
        parking: parkings[3]._id,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
        duration: 180,
        floor: 'Niveau -1',
        spotNumber: 'B15',
        spotType: 'standard',
        vehicle: { brand: 'Dacia', model: 'Duster', licensePlate: '12345-A-1', type: 'car' },
        pricing: { hourlyRate: 15, amount: 50, currency: 'MAD', breakdown: { base: 45, serviceFee: 3, taxes: 2 } },
        payment: { method: 'card', status: 'paid', paidAt: new Date() },
        status: 'active',
        confirmationCode: 'UM-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        qrCode: crypto.randomBytes(16).toString('hex'),
      },
    ];

    const reservations = await Reservation.insertMany(demoReservations);
    console.log(`   ${reservations.length} réservations créées`);

    // Créer des avis de démo
    console.log('⭐ Création des avis...');
    const demoReviews = [
      {
        user: user._id,
        parking: parkings[0]._id,
        reservation: reservations[0]._id,
        rating: 5,
        title: 'Excellent parking !',
        comment: 'Très propre, bien éclairé et sécurisé. Le personnel est très accueillant. Je recommande vivement ce parking pour les visites au centre d\'Agdal.',
        aspects: { cleanliness: 5, security: 5, accessibility: 4, value: 4 },
      },
      {
        user: user._id,
        parking: parkings[3]._id,
        reservation: reservations[0]._id,
        rating: 4,
        title: 'Très bon parking premium',
        comment: 'Le parking du Morocco Mall est vraiment bien entretenu. Les places sont larges et le service de voiturier est impeccable. Prix un peu élevé mais la qualité est au rendez-vous.',
        aspects: { cleanliness: 5, security: 5, accessibility: 5, value: 3 },
      },
    ];

    for (const reviewData of demoReviews) {
      const review = new Review(reviewData);
      await review.save();
    }
    console.log(`   ${demoReviews.length} avis créés`);

    console.log('\n✅ Seed v2 terminé avec succès!');
    console.log('\n📋 Récapitulatif:');
    console.log(`   - Parkings: ${parkings.length}`);
    console.log(`   - Alertes: ${alerts.length}`);
    console.log(`   - Utilisateurs: 2 (demo + admin)`);
    console.log(`   - Réservations: ${reservations.length}`);
    console.log(`   - Avis: ${demoReviews.length}`);
    console.log('\n🔐 Identifiants de démonstration:');
    console.log(`   Demo  → Email: demo@urbanmove.ma  | Mot de passe: demo123456`);
    console.log(`   Admin → Email: admin@urbanmove.ma | Mot de passe: admin123456`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

// Exécuter le seed
seed();
