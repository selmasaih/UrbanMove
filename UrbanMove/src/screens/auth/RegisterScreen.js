import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { CITIES } from '../../constants/config';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: 'rabat',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const { register, loading } = useAuth();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^(06|07)[0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro marocain invalide (06/07XXXXXXXX)';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'Vous devez accepter les conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      city: formData.city,
    });
    
    if (!result.success) {
      Alert.alert('Erreur', result.message || 'Impossible de créer le compte');
    }
  };

  const renderInput = (field, label, placeholder, icon, options = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        errors[field] && styles.inputError
      ]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={errors[field] ? COLORS.error : COLORS.gray} 
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={formData[field]}
          onChangeText={(value) => updateField(field, value)}
          secureTextEntry={options.secure && (field === 'password' ? !showPassword : !showConfirmPassword)}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'none'}
        />
        {options.secure && (
          <TouchableOpacity
            onPress={() => field === 'password' 
              ? setShowPassword(!showPassword) 
              : setShowConfirmPassword(!showConfirmPassword)
            }
            style={styles.eyeButton}
          >
            <Ionicons 
              name={(field === 'password' ? showPassword : showConfirmPassword) 
                ? 'eye-outline' 
                : 'eye-off-outline'
              } 
              size={20} 
              color={COLORS.gray}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Titre */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Rejoignez UrbanMove pour une mobilité intelligente
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: SIZES.sm }]}>
                <Text style={styles.inputLabel}>Prénom</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.firstName && styles.inputError
                ]}>
                  <TextInput
                    style={[styles.input, { paddingLeft: SIZES.md }]}
                    placeholder="Prénom"
                    placeholderTextColor={COLORS.gray}
                    value={formData.firstName}
                    onChangeText={(value) => updateField('firstName', value)}
                    autoCapitalize="words"
                  />
                </View>
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>
              
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Nom</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.lastName && styles.inputError
                ]}>
                  <TextInput
                    style={[styles.input, { paddingLeft: SIZES.md }]}
                    placeholder="Nom"
                    placeholderTextColor={COLORS.gray}
                    value={formData.lastName}
                    onChangeText={(value) => updateField('lastName', value)}
                    autoCapitalize="words"
                  />
                </View>
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>
            </View>

            {renderInput('email', 'Email', 'votre@email.com', 'mail-outline', {
              keyboardType: 'email-address'
            })}
            
            {renderInput('phone', 'Téléphone', '06XXXXXXXX', 'call-outline', {
              keyboardType: 'phone-pad'
            })}
            
            {renderInput('password', 'Mot de passe', '••••••••', 'lock-closed-outline', {
              secure: true
            })}
            
            {renderInput('confirmPassword', 'Confirmer', '••••••••', 'lock-closed-outline', {
              secure: true
            })}

            {/* City Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ville</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SIZES.sm }}>
                {(CITIES || [
                  { id: 'rabat', name: 'Rabat' },
                  { id: 'casablanca', name: 'Casablanca' },
                  { id: 'tanger', name: 'Tanger' },
                  { id: 'marrakech', name: 'Marrakech' },
                  { id: 'fes', name: 'Fes' },
                  { id: 'agadir', name: 'Agadir' },
                ]).map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.cityChip,
                      formData.city === city.id && styles.cityChipActive,
                    ]}
                    onPress={() => updateField('city', city.id)}
                  >
                    <Text style={[
                      styles.cityChipText,
                      formData.city === city.id && styles.cityChipTextActive,
                    ]}>
                      {city.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Conditions */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[
                styles.checkbox,
                acceptTerms && styles.checkboxChecked,
                errors.terms && styles.checkboxError
              ]}>
                {acceptTerms && (
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                )}
              </View>
              <Text style={styles.termsText}>
                J'accepte les{' '}
                <Text style={styles.termsLink}>conditions d'utilisation</Text>
                {' '}et la{' '}
                <Text style={styles.termsLink}>politique de confidentialité</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={[styles.errorText, { marginTop: -SIZES.sm }]}>
                {errors.terms}
              </Text>
            )}

            {/* Bouton inscription */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>

            {/* Lien connexion */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  header: {
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  titleContainer: {
    marginTop: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    paddingHorizontal: SIZES.md,
    height: 56,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    padding: SIZES.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.fontSm,
    marginTop: SIZES.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.lg,
    marginTop: SIZES.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: SIZES.radiusSm,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginRight: SIZES.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxError: {
    borderColor: COLORS.error,
  },
  termsText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    marginBottom: SIZES.lg,
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: SIZES.fontMd,
    color: COLORS.primary,
    fontWeight: '600',
  },
  cityChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white,
    marginRight: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  cityChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cityChipText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cityChipTextActive: {
    color: COLORS.white,
  },
});

export default RegisterScreen;
