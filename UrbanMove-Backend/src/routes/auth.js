const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Générer un refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', rateLimiter.auth, [
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit avoir entre 2 et 50 caractères'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit avoir entre 2 et 50 caractères'),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Le téléphone est requis')
    .matches(/^(06|07|05)\d{8}$/).withMessage('Numéro marocain invalide (ex: 0612345678)'),
  body('password').isLength({ min: 6 }).withMessage('Minimum 6 caractères')
    .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre'),
  body('city').optional().isIn(['rabat', 'casablanca', 'tanger', 'marrakech', 'fes', 'agadir']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { firstName, lastName, email, phone, password, city } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé',
      });
    }

    // Créer l'utilisateur
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      city: city || 'rabat',
    });

    // Générer un token de vérification email
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // TODO: Envoyer l'email de vérification
    console.log(`📧 Verification token for ${email}: ${verificationToken}`);

    // Générer les tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie ! Vérifiez votre email.',
      token,
      refreshToken,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion utilisateur
// @access  Public
router.post('/login', rateLimiter.auth, [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Compte temporairement verrouillé. Réessayez dans 30 minutes.',
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Ce compte a été désactivé',
      });
    }

    // Réinitialiser les tentatives et mettre à jour lastLogin
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      refreshToken,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Rafraîchir le token JWT
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token invalide ou expiré' });
  }
});

// @route   GET /api/auth/profile
// @desc    Obtenir le profil de l'utilisateur connecté
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Mettre à jour le profil
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().trim().matches(/^(06|07|05)\d{8}$/),
  body('city').optional().isIn(['rabat', 'casablanca', 'tanger', 'marrakech', 'fes', 'agadir']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'city', 'avatar'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Changer le mot de passe
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Minimum 6 caractères')
    .matches(/\d/).withMessage('Doit contenir au moins un chiffre'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
      token,
    });
  } catch (error) {
    console.error('Erreur change password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Demande de réinitialisation de mot de passe
// @access  Public
router.post('/forgot-password', rateLimiter.auth, [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (user) {
      const resetToken = user.generateResetToken();
      await user.save({ validateBeforeSave: false });
      // TODO: Envoyer l'email avec le lien de réinitialisation
      console.log(`🔑 Reset token for ${email}: ${resetToken}`);
    }

    // Ne pas révéler si l'email existe ou non (sécurité)
    res.json({
      success: true,
      message: 'Si cet email est associé à un compte, un lien de réinitialisation a été envoyé.',
    });
  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande',
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Réinitialiser le mot de passe avec le token
// @access  Public
router.post('/reset-password/:token', rateLimiter.auth, [
  body('password').isLength({ min: 6 }).withMessage('Minimum 6 caractères'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      token,
    });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation',
    });
  }
});

// @route   POST /api/auth/verify-email/:token
// @desc    Vérifier l'adresse email
// @access  Public
router.post('/verify-email/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide ou expiré',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email vérifié avec succès' });
  } catch (error) {
    console.error('Erreur verify email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Déconnexion
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({ success: true, message: 'Déconnexion réussie' });
});

module.exports = router;
