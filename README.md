# 🚗 UrbanMove - Smart Urban Mobility

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen.svg?style=for-the-badge)
![CI](https://github.com/selmasaih/UrbanMove/actions/workflows/backend-ci.yml/badge.svg?style=for-the-badge)

<p align="center">
  <img src="./screenshot.png" alt="UrbanMove Screenshot" width="300"/>
</p>

> **Note:** This repository is documented in English for professional visibility, but the mobile application's user interface is currently in **French**.

A smart urban mobility mobile application designed to improve traffic flow and parking management in major Moroccan cities (Rabat, Casablanca, Tangier).

## 📥 Download the App (Android)

You can install and test the production-ready Android application directly on your phone:
1. Go to the [**Releases Tab**](https://github.com/selmasaih/UrbanMove/releases).
2. Download the `UrbanMove-v1.0.0.apk` file to your Android device.
3. Install the APK and launch the app (Backend is fully connected to the cloud).

## 📱 Features

### Smart Parking
- Find nearby parking lots on the map
- Real-time availability tracking
- Online reservation and secure payment
- Turn-by-turn navigation to the parking spot

### Smart Navigation
- Optimized route calculation
- Smart traffic light integration
- Time and CO2 emission savings
- Turn-by-turn driving instructions

### Real-time Alerts
- Accidents and incidents reporting
- Roadwork notifications
- Special events tracking
- Live traffic conditions

### User Profile
- Personal vehicle management
- Electronic wallet for payments
- Reservation history
- Personal mobility statistics

## 🛠️ Technical Stack

### Frontend (Mobile App)
- **React Native** + **Expo SDK 50**
- React Navigation 6.x
- react-native-maps
- expo-location
- Axios

### Backend (REST API)
- **Node.js** + **Express 4.x**
- **MongoDB** + **Mongoose 8.x**
- JWT Authentication
- Geospatial Queries

## 📁 Project Structure

```text
UrbanMove-Workspace/
├── UrbanMove/                 # React Native Mobile Application
│   ├── src/
│   │   ├── screens/          # App screens
│   │   ├── navigation/       # Navigation configuration
│   │   ├── services/         # API services
│   │   ├── context/          # Context providers
│   │   └── constants/        # Theme & configs
│   ├── App.js
│   └── package.json
│
└── UrbanMove-Backend/         # Node.js REST API
    ├── src/
    │   ├── models/           # Mongoose models
    │   ├── routes/           # Express routes
    │   ├── middleware/       # Custom middlewares
    │   └── seeds/            # Demo data seeders
    ├── .env.example      # Environment variables template
    └── package.json
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB (Local or Atlas)
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

```bash
# Navigate to the backend directory
cd UrbanMove-Backend

# Install dependencies
npm install

# Configure environment variables
# Edit the .env file with your specific configurations

# Start MongoDB (if using local instance)
mongod

# Seed the database with demo data (Optional)
npm run seed

# Start the server
npm run dev
```

The server will start on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to the frontend directory
cd UrbanMove

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with the Expo Go app on your phone to launch the app.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Parking
- `GET /api/parking` - List all parking lots
- `GET /api/parking/nearby?lat=&lng=` - Find nearby parking
- `GET /api/parking/:id` - Get parking details
- `POST /api/parking/:id/reserve` - Reserve a spot
- `GET /api/parking/reservations/my` - My reservations

### Navigation
- `POST /api/navigation/route` - Calculate route
- `GET /api/navigation/traffic` - Traffic status
- `GET /api/navigation/smart-lights` - Smart traffic lights

### Alerts
- `GET /api/alerts` - List all alerts
- `GET /api/alerts/nearby?lat=&lng=` - Nearby alerts
- `POST /api/alerts` - Report an alert
- `PUT /api/alerts/:id/confirm` - Confirm an alert

### User
- `GET /api/user/profile` - Full profile details
- `PUT /api/user/profile` - Update profile
- `GET /api/user/vehicles` - My vehicles
- `POST /api/user/vehicles` - Add a vehicle
- `GET /api/user/wallet` - My wallet balance
- `POST /api/user/wallet/topup` - Top up wallet

## 🔐 Demo Credentials

After running the database seed, you can log in using:

- **Email**: demo@urbanmove.ma
- **Password**: demo123456

## 🏙️ Supported Cities

| City | Parking Lots | Smart Traffic Lights |
|-------|----------|-------------------|
| Rabat | 3 | 3 |
| Casablanca | 3 | 3 |
| Tangier | 2 | 2 |

## 🧪 Testing Setup

The backend API is configured with **Jest** and **Supertest** for endpoint testing.
To run the testing suite:
```bash
cd UrbanMove-Backend
npm test
```

## 🗺️ Future Roadmap

While this MVP is production-ready, future architectural improvements include:
- **TypeScript Migration:** Gradual migration to TypeScript for enhanced type safety and scalability.
- **E2E Testing:** Implementation of end-to-end tests using Detox (Mobile) and Cypress (Web Dashboard).
- **i18n Support:** Full internationalization to support dynamic switching between French, English, and Arabic.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**UrbanMove** - Simplifying urban mobility in Morocco 🇲🇦
