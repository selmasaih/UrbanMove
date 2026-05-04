# 🚗 UrbanMove - Smart Urban Mobility

Application mobile de mobilité urbaine intelligente pour les villes marocaines (Rabat, Casablanca, Tanger).

## 📱 Fonctionnalités

### Smart Parking
- Localisation des parkings à proximité
- Disponibilité en temps réel
- Réservation et paiement en ligne
- Navigation vers le parking

### Smart Navigation
- Calcul d'itinéraires optimisés
- Intégration des feux tricolores intelligents
- Économie de temps et de CO2
- Instructions turn-by-turn

### Alertes en Temps Réel
- Accidents et incidents
- Travaux routiers
- Événements
- État du trafic

### Profil Utilisateur
- Gestion des véhicules
- Portefeuille électronique
- Historique des réservations
- Statistiques personnelles

## 🛠️ Stack Technique

### Frontend (Mobile)
- **React Native** + **Expo SDK 50**
- React Navigation 6.x
- react-native-maps
- expo-location
- Axios

### Backend (API)
- **Node.js** + **Express 4.x**
- **MongoDB** + **Mongoose 8.x**
- JWT Authentication
- Geospatial Queries

## 📁 Structure du Projet

```
frproject/
├── UrbanMove/                 # Application mobile React Native
│   ├── src/
│   │   ├── screens/          # Écrans de l'application
│   │   ├── navigation/       # Configuration de la navigation
│   │   ├── services/         # Services API
│   │   ├── context/          # Context providers
│   │   └── constants/        # Thème et configuration
│   ├── App.js
│   └── package.json
│
└── UrbanMove-Backend/         # API REST Node.js
    ├── src/
    │   ├── models/           # Modèles Mongoose
    │   ├── routes/           # Routes Express
    │   ├── middleware/       # Middlewares
    │   └── seeds/            # Données de démonstration
    ├── .env
    └── package.json
```

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- MongoDB (local ou Atlas)
- Expo CLI (`npm install -g expo-cli`)

### Backend

```bash
# Naviguer vers le dossier backend
cd UrbanMove-Backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Éditer le fichier .env avec vos paramètres

# Lancer MongoDB (si local)
mongod

# Peupler la base de données (optionnel)
npm run seed

# Démarrer le serveur
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

### Frontend

```bash
# Naviguer vers le dossier frontend
cd UrbanMove

# Installer les dépendances
npm install

# Démarrer Expo
npx expo start
```

Scanner le QR code avec l'app Expo Go sur votre téléphone.

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion

### Parkings
- `GET /api/parking` - Liste des parkings
- `GET /api/parking/nearby?lat=&lng=` - Parkings à proximité
- `GET /api/parking/:id` - Détail d'un parking
- `POST /api/parking/:id/reserve` - Réserver une place
- `GET /api/parking/reservations/my` - Mes réservations

### Navigation
- `POST /api/navigation/route` - Calculer un itinéraire
- `GET /api/navigation/traffic` - État du trafic
- `GET /api/navigation/smart-lights` - Feux intelligents

### Alertes
- `GET /api/alerts` - Liste des alertes
- `GET /api/alerts/nearby?lat=&lng=` - Alertes à proximité
- `POST /api/alerts` - Signaler une alerte
- `PUT /api/alerts/:id/confirm` - Confirmer une alerte

### Utilisateur
- `GET /api/user/profile` - Profil complet
- `PUT /api/user/profile` - Modifier le profil
- `GET /api/user/vehicles` - Mes véhicules
- `POST /api/user/vehicles` - Ajouter un véhicule
- `GET /api/user/wallet` - Mon portefeuille
- `POST /api/user/wallet/topup` - Recharger

## 🔐 Identifiants de Démonstration

Après avoir exécuté le seed :

- **Email**: demo@urbanmove.ma
- **Mot de passe**: demo123456

## 🏙️ Villes Supportées

| Ville | Parkings | Feux Intelligents |
|-------|----------|-------------------|
| Rabat | 3 | 3 |
| Casablanca | 3 | 3 |
| Tanger | 2 | 2 |

## 📄 Licence

Ce projet est développé dans un cadre éducatif.

---

**UrbanMove** - Simplifier la mobilité urbaine au Maroc 🇲🇦
