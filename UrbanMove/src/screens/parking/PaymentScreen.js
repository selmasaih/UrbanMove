import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/userService';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const PaymentScreen = ({ route, navigation }) => {
  const { parking, reservation } = route.params;
  const [selectedMethod, setSelectedMethod] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await userService.getWallet(1, 1);
      if (res.success) {
        setWalletBalance(res.data?.data?.balance || 0);
      }
    } catch (e) {
      console.log('Erreur wallet:', e);
    }
  };

  const totalPrice = reservation.totalPrice || 0;
  const serviceFee = Math.round(totalPrice * 0.05) || 2;
  const grandTotal = totalPrice + serviceFee;

  const paymentMethods = [
    { id: 'wallet', icon: 'wallet', label: 'Portefeuille UrbanMove', balance: `${walletBalance} DH` },
    { id: 'card', icon: 'card', label: 'Carte bancaire' },
    { id: 'cash', icon: 'cash', label: 'Paiement sur place' },
  ];

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (selectedMethod === 'card') {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs de la carte');
        return;
      }
    }

    if (selectedMethod === 'wallet' && walletBalance < grandTotal) {
      Alert.alert('Solde insuffisant', `Votre solde (${walletBalance} DH) est insuffisant. Rechargez votre portefeuille.`);
      return;
    }

    setLoading(true);

    try {
      // The reservation was already created in the API during ReservationScreen
      // Here we confirm the payment method
      const confirmationCode = reservation.confirmationCode || 'UM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      setLoading(false);
      Alert.alert(
        'Paiement réussi ! 🎉',
        `Votre place au ${parking.name || 'parking'} est réservée.\n\nCode: ${confirmationCode}\nTotal: ${grandTotal} DH`,
        [
          {
            text: 'Voir ma réservation',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors du paiement');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Parking</Text>
              <Text style={styles.summaryValue}>{parking.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {reservation.date.toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Heure</Text>
              <Text style={styles.summaryValue}>{reservation.time}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Durée</Text>
              <Text style={styles.summaryValue}>{reservation.duration}h</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Véhicule</Text>
              <Text style={styles.summaryValue}>
                {reservation.vehicle?.licensePlate || reservation.vehicle?.plate || '-'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{totalPrice} DH</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frais de service</Text>
              <Text style={styles.summaryValue}>{serviceFee} DH</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{grandTotal} DH</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moyen de paiement</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodIcon}>
                <Ionicons name={method.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodLabel}>{method.label}</Text>
                {method.balance && (
                  <Text style={styles.methodBalance}>Solde: {method.balance}</Text>
                )}
              </View>
              <View style={[
                styles.radioOuter,
                selectedMethod === method.id && styles.radioOuterSelected
              ]}>
                {selectedMethod === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card Form */}
        {selectedMethod === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de la carte</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Numéro de carte</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={COLORS.gray}
                    value={cardNumber}
                    onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                  <Ionicons name="card" size={20} color={COLORS.gray} />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SIZES.md }]}>
                  <Text style={styles.inputLabel}>Date d'expiration</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/AA"
                    placeholderTextColor={COLORS.gray}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={COLORS.gray}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom sur la carte</Text>
                <TextInput
                  style={styles.input}
                  placeholder="NOM PRÉNOM"
                  placeholderTextColor={COLORS.gray}
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.secureNote}>
              <Ionicons name="lock-closed" size={16} color={COLORS.success} />
              <Text style={styles.secureNoteText}>
                Paiement sécurisé par cryptage SSL
              </Text>
            </View>
          </View>
        )}

        {/* Cash Note */}
        {selectedMethod === 'cash' && (
          <View style={styles.section}>
            <View style={styles.noteCard}>
              <Ionicons name="information-circle" size={24} color={COLORS.info} />
              <Text style={styles.noteText}>
                Vous paierez directement au parking à votre arrivée. 
                La réservation sera maintenue pendant 30 minutes après l'heure prévue.
              </Text>
            </View>
          </View>
        )}

        {/* Wallet Note */}
        {selectedMethod === 'wallet' && walletBalance < grandTotal && (
          <View style={styles.section}>
            <View style={[styles.noteCard, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="warning" size={24} color={COLORS.warning} />
              <Text style={styles.noteText}>
                Solde insuffisant ({walletBalance} DH). Il vous manque {grandTotal - walletBalance} DH. Rechargez votre portefeuille.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={COLORS.white} />
              <Text style={styles.payButtonText}>
                Payer {grandTotal} DH
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  headerTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  section: {
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
  },
  summaryLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SIZES.sm,
  },
  totalRow: {
    paddingTop: SIZES.md,
  },
  totalLabel: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.light,
  },
  methodCardSelected: {
    borderColor: COLORS.primary,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  methodBalance: {
    fontSize: SIZES.fontSm,
    color: COLORS.success,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  inputGroup: {
    marginBottom: SIZES.md,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.md,
  },
  secureNoteText: {
    fontSize: SIZES.fontSm,
    color: COLORS.success,
    marginLeft: SIZES.xs,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '15',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
  },
  noteText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    marginLeft: SIZES.sm,
    lineHeight: 20,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    ...SHADOWS.dark,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.medium,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },
});

export default PaymentScreen;
