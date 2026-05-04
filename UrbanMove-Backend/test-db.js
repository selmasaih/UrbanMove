require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔄 Test de connexion MongoDB Atlas...');
console.log('URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));

// Timeout de 30 secondes
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
})
  .then(() => {
    console.log('✅ CONNECTÉ À MONGODB ATLAS !');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ ERREUR:', err.message);
    process.exit(1);
  });
