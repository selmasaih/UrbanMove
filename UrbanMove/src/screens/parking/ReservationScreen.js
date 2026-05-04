import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { parkingService } from '../../services/parkingService';
import { userService } from '../../services/userService';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const SPOT_TYPES = [
  { key: 'standard', label: 'Standard', icon: 'car', surcharge: 1 },
  { key: 'electric', label: 'Électrique', icon: 'flash', surcharge: 1.2 },
  { key: 'handicapped', label: 'PMR', icon: 'accessibility', surcharge: 1 },
  { key: 'motorcycle', label: 'Moto', icon: 'bicycle', surcharge: 0.5 },
];

const ReservationScreen = ({ route, navigation }) => {
  const { parking } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedSpotType, setSelectedSpotType] = useState('standard');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await userService.getVehicles();
      if (res.success) {
        const v = res.data?.data || [];
        setVehicles(v);
        // Select default vehicle
        const defaultV = v.find(veh => veh.isDefault) || v[0];
        if (defaultV) setSelectedVehicle(defaultV._id || defaultV.id);
      }
    } catch (e) {
      console.log('Erreur chargement véhicules:', e);
    } finally {
      setLoading(false);
    }
  };

  const durations = [1, 2, 3, 4, 6, 8, 12, 24];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00',
  ];

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  const getDayName = (date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  const spotSurcharge = SPOT_TYPES.find(s => s.key === selectedSpotType)?.surcharge || 1;
  const totalPrice = Math.round(parking.pricePerHour * selectedDuration * spotSurcharge);

  const handleReservation = async () => {
    if (!selectedVehicle && vehicles.length > 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un véhicule');
      return;
    }

    const selectedV = vehicles.find(v => (v._id || v.id) === selectedVehicle);
    
    setSubmitting(true);
    try {
      const parkingId = parking._id || parking.id;
      const startDateTime = new Date(selectedDate);
      const [hours, mins] = selectedTime.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(mins), 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + selectedDuration);

      const reservationData = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        spotType: selectedSpotType,
        vehicle: selectedV ? {
          brand: selectedV.brand,
          model: selectedV.model,
          licensePlate: selectedV.licensePlate,
          color: selectedV.color,
          type: selectedV.type,
        } : undefined,
        paymentMethod: 'wallet',
      };

      const res = await parkingService.reserveSpot(parkingId, reservationData);
      if (res.success) {
        const reservation = res.data?.data;
        navigation.navigate('Payment', {
          parking,
          reservation: {
            ...reservation,
            date: selectedDate,
            time: selectedTime,
            duration: selectedDuration,
            vehicle: selectedV,
            totalPrice: reservation?.pricing?.total || totalPrice,
          },
        });
      } else {
        Alert.alert('Erreur', res.data?.message || 'Impossible de réserver');
      }
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
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
        <Text style={styles.headerTitle}>Réservation</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Parking Summary */}
        <View style={styles.parkingSummary}>
          <View style={styles.parkingIcon}>
            <Ionicons name="car" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.parkingInfo}>
            <Text style={styles.parkingName}>{parking.name}</Text>
            <Text style={styles.parkingAddress}>{typeof parking.address === 'object' ? [parking.address?.street, parking.address?.city].filter(Boolean).join(', ') : (parking.address || '')}</Text>
          </View>
          <View style={styles.parkingPrice}>
            <Text style={styles.priceValue}>{parking.pricePerHour} DH</Text>
            <Text style={styles.priceUnit}>/h</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  selectedDate.toDateString() === date.toDateString() && styles.dateCardSelected
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateDayName,
                  selectedDate.toDateString() === date.toDateString() && styles.dateTextSelected
                ]}>
                  {getDayName(date)}
                </Text>
                <Text style={[
                  styles.dateDay,
                  selectedDate.toDateString() === date.toDateString() && styles.dateTextSelected
                ]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heure d'arrivée</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.timeSlotSelected
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeSlotText,
                  selectedTime === time && styles.timeSlotTextSelected
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durée</Text>
          <View style={styles.durationGrid}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationCard,
                  selectedDuration === duration && styles.durationCardSelected
                ]}
                onPress={() => setSelectedDuration(duration)}
              >
                <Text style={[
                  styles.durationValue,
                  selectedDuration === duration && styles.durationTextSelected
                ]}>
                  {duration}h
                </Text>
                <Text style={[
                  styles.durationPrice,
                  selectedDuration === duration && styles.durationPriceSelected
                ]}>
                  {parking.pricePerHour * duration} DH
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spot Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de place</Text>
          <View style={styles.durationGrid}>
            {SPOT_TYPES.map((spot) => (
              <TouchableOpacity
                key={spot.key}
                style={[
                  styles.durationCard,
                  selectedSpotType === spot.key && styles.durationCardSelected
                ]}
                onPress={() => setSelectedSpotType(spot.key)}
              >
                <Ionicons 
                  name={spot.icon} 
                  size={20} 
                  color={selectedSpotType === spot.key ? COLORS.white : COLORS.textPrimary} 
                />
                <Text style={[
                  styles.durationValue,
                  { fontSize: SIZES.fontSm },
                  selectedSpotType === spot.key && styles.durationTextSelected
                ]}>
                  {spot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Véhicule</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : vehicles.length > 0 ? (
            vehicles.map((vehicle) => {
              const vId = vehicle._id || vehicle.id;
              return (
                <TouchableOpacity
                  key={vId}
                  style={[
                    styles.vehicleCard,
                    selectedVehicle === vId && styles.vehicleCardSelected
                  ]}
                  onPress={() => setSelectedVehicle(vId)}
                >
                  <View style={styles.vehicleIcon}>
                    <Ionicons name="car-sport" size={24} color={COLORS.textPrimary} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                    <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                  </View>
                  {selectedVehicle === vId && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <TouchableOpacity
              style={styles.vehicleCard}
              onPress={() => Alert.alert('Info', 'Ajoutez un véhicule dans votre profil')}
            >
              <View style={styles.vehicleIcon}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleName, styles.vehicleNameAdd]}>
                  Ajouter un véhicule
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Summary */}
      <View style={styles.bottomSummary}>
        <View style={styles.summaryDetails}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {selectedDate.toLocaleDateString('fr-FR')} à {selectedTime}
            </Text>
            <Text style={styles.summaryDuration}>{selectedDuration}h</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalPrice} DH</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, submitting && { opacity: 0.6 }]}
          onPress={handleReservation}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Continuer vers le paiement</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
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
  parkingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.light,
  },
  parkingIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  parkingInfo: {
    flex: 1,
  },
  parkingName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  parkingAddress: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  parkingPrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
  },
  section: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  dateCard: {
    width: 64,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    marginRight: SIZES.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.light,
  },
  dateCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateDayName: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  dateDay: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  dateTextSelected: {
    color: COLORS.white,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.light,
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: COLORS.white,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  durationCard: {
    width: '23%',
    paddingVertical: SIZES.md,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    marginRight: '2%',
    marginBottom: SIZES.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.light,
  },
  durationCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  durationPrice: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  durationTextSelected: {
    color: COLORS.white,
  },
  durationPriceSelected: {
    color: COLORS.white,
    opacity: 0.9,
  },
  vehicleCard: {
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
  vehicleCardSelected: {
    borderColor: COLORS.primary,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  vehicleNameAdd: {
    color: COLORS.primary,
  },
  vehiclePlate: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bottomSummary: {
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
  summaryDetails: {
    marginBottom: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  summaryLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  summaryDuration: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.medium,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    marginRight: SIZES.sm,
  },
});

export default ReservationScreen;
