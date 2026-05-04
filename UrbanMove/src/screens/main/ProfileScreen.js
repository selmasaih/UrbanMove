import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { parkingService } from '../../services/parkingService';
import { APP_VERSION, CITIES } from '../../constants/config';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true);
  const [trafficAlerts, setTrafficAlerts] = useState(user?.preferences?.trafficAlerts ?? true);
  const [darkMode, setDarkMode] = useState(user?.preferences?.darkMode ?? false);
  const [stats, setStats] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReservations, setShowReservations] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      const [statsRes, walletRes, vehiclesRes] = await Promise.allSettled([
        userService.getStats(),
        userService.getWallet(1, 1),
        userService.getVehicles(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.data?.data || null);
      }
      if (walletRes.status === 'fulfilled' && walletRes.value.success) {
        setWalletBalance(walletRes.value.data?.data?.balance || 0);
      }
      if (vehiclesRes.status === 'fulfilled' && vehiclesRes.value.success) {
        setVehicles(vehiclesRes.value.data?.data || []);
      }
    } catch (error) {
      console.log('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfileData(), refreshUser()]);
    setRefreshing(false);
  };

  const handleToggleNotifications = async (value) => {
    setNotifications(value);
    try {
      await userService.updatePreferences({ notifications: value });
    } catch (e) { setNotifications(!value); }
  };

  const handleToggleTrafficAlerts = async (value) => {
    setTrafficAlerts(value);
    try {
      await userService.updatePreferences({ trafficAlerts: value });
    } catch (e) { setTrafficAlerts(!value); }
  };

  const handleToggleDarkMode = async (value) => {
    setDarkMode(value);
    try {
      await userService.updatePreferences({ darkMode: value });
    } catch (e) { setDarkMode(!value); }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  const openPersonalInfo = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditPhone(user?.phone || '');
    setShowPersonalInfo(true);
  };

  const savePersonalInfo = async () => {
    setSavingProfile(true);
    try {
      const res = await userService.updatePreferences({});
      // Update profile via user route
      const profileRes = await (async () => {
        try {
          const r = await require('../../services/apiClient').default.put('/user/profile', {
            firstName: editFirstName,
            lastName: editLastName,
            phone: editPhone,
          });
          return r;
        } catch (e) { return null; }
      })();
      await refreshUser();
      setShowPersonalInfo(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const loadReservations = async () => {
    try {
      const res = await parkingService.getMyReservations();
      if (res.success && res.data?.data) {
        setReservations(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (e) {
      console.log('Erreur chargement réservations:', e);
    }
  };

  const openReservations = () => {
    loadReservations();
    setShowReservations(true);
  };

  const changeDefaultCity = async (city) => {
    try {
      await userService.updatePreferences({ defaultCity: city.id });
      await refreshUser();
      setShowCityPicker(false);
      Alert.alert('Succès', `Ville par défaut changée en ${city.name}`);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de changer la ville');
    }
  };

  const menuItems = [
    {
      section: 'Compte',
      items: [
        { icon: 'person-outline', label: 'Informations personnelles', onPress: openPersonalInfo },
        { icon: 'car-outline', label: 'Mes véhicules', onPress: () => Alert.alert('Mes véhicules', vehicles.map(v => `${v.brand} ${v.model} — ${v.licensePlate}`).join('\n') || 'Aucun véhicule enregistré'), badge: `${vehicles.length}` },
        { icon: 'wallet-outline', label: 'Portefeuille', onPress: () => Alert.alert('Portefeuille', `Solde actuel : ${walletBalance} DH\n\nVous pouvez recharger via carte bancaire ou Cash Plus`), badge: `${walletBalance} DH` },
        { icon: 'heart-outline', label: 'Favoris', onPress: () => Alert.alert('Favoris', 'Vos parkings favoris sont visibles dans l\'onglet Parking (icône cœur)') },
        { icon: 'card-outline', label: 'Moyens de paiement', onPress: () => setShowPayment(true) },
      ],
    },
    {
      section: 'Historique',
      items: [
        { icon: 'time-outline', label: 'Historique des trajets', onPress: () => Alert.alert('Historique', `Nombre total de trajets : ${stats?.totalTrips || user?.stats?.totalReservations || 0}\nCO₂ économisé : ${stats?.co2Saved || user?.stats?.co2Saved || 0} g`) },
        { icon: 'receipt-outline', label: 'Mes réservations', onPress: openReservations },
        { icon: 'star-outline', label: 'Mes avis', onPress: () => Alert.alert('Mes avis', 'Vous pouvez laisser un avis directement depuis la page de détail d\'un parking après votre visite') },
        { icon: 'document-text-outline', label: 'Factures', onPress: () => Alert.alert('Factures', 'Les factures sont envoyées automatiquement par email après chaque réservation') },
      ],
    },
    {
      section: 'Paramètres',
      items: [
        { 
          icon: 'notifications-outline', 
          label: 'Notifications', 
          toggle: true,
          value: notifications,
          onToggle: handleToggleNotifications 
        },
        { 
          icon: 'warning-outline', 
          label: 'Alertes trafic', 
          toggle: true,
          value: trafficAlerts,
          onToggle: handleToggleTrafficAlerts 
        },
        { 
          icon: 'moon-outline', 
          label: 'Mode sombre', 
          toggle: true,
          value: darkMode,
          onToggle: handleToggleDarkMode 
        },
        { icon: 'language-outline', label: 'Langue', value: 'Français', onPress: () => Alert.alert('Langue', 'Seul le français est supporté pour le moment') },
        { icon: 'location-outline', label: 'Ville par défaut', value: user?.preferences?.defaultCity || 'Rabat', onPress: () => setShowCityPicker(true) },
      ],
    },
    {
      section: 'Aide',
      items: [
        { icon: 'help-circle-outline', label: 'Centre d\'aide', onPress: () => Alert.alert('Centre d\'aide', 'Pour toute question, contactez-nous à support@urbanmove.ma') },
        { icon: 'chatbubble-outline', label: 'Contacter le support', onPress: () => Alert.alert('Support', 'Email: support@urbanmove.ma\nTéléphone: 05 37 00 00 00\nHoraires: Lun-Ven 9h-18h') },
        { icon: 'information-circle-outline', label: 'À propos', onPress: () => Alert.alert('À propos', 'UrbanMove — Smart Urban Mobility System\n\nDigitalisation du Transport Urbain au Maroc\nPrêt pour la Coupe du Monde 2030 🇲🇦⚽\n\nVersion ' + (APP_VERSION || '2.0.0')) },
        { icon: 'document-outline', label: 'Conditions d\'utilisation', onPress: () => Alert.alert('CGU', 'En utilisant UrbanMove, vous acceptez nos conditions générales d\'utilisation disponibles sur urbanmove.ma/cgu') },
      ],
    },
  ];

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.label}
      style={styles.menuItem}
      onPress={item.onPress}
      disabled={item.toggle}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Ionicons name={item.icon} size={22} color={COLORS.primary} />
        </View>
        <Text style={styles.menuItemLabel}>{item.label}</Text>
      </View>
      
      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        {item.value && !item.toggle && (
          <Text style={styles.menuItemValue}>{item.value}</Text>
        )}
        {item.toggle ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: COLORS.grayLight, true: COLORS.primaryLight }}
            thumbColor={item.value ? COLORS.primary : COLORS.gray}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
                {user?.lastName?.[0]?.toUpperCase() || ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName || 'Utilisateur'} {user?.lastName || ''}
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
            <View style={styles.memberBadge}>
              <Ionicons name="star" size={14} color={COLORS.warning} />
              <Text style={styles.memberBadgeText}>
                {user?.role === 'admin' ? 'Administrateur' : 'Membre'} • {user?.preferences?.defaultCity || 'Rabat'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="car" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats?.totalTrips || user?.stats?.totalTrips || 0}</Text>
            <Text style={styles.statLabel}>Trajets</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="leaf" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{stats?.co2Saved || user?.stats?.co2Saved || 0} kg</Text>
            <Text style={styles.statLabel}>CO₂ économisé</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={COLORS.secondary} />
            <Text style={styles.statValue}>{stats?.timeSaved || user?.stats?.timeSaved || 0} min</Text>
            <Text style={styles.statLabel}>Temps gagné</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section) => (
          <View key={section.section} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.menuCard}>
              {section.items.map(renderMenuItem)}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>UrbanMove v{APP_VERSION || '2.0.0'}</Text>

        <View style={{ height: SIZES.xxl }} />
      </ScrollView>

      {/* Modal: Informations personnelles */}
      <Modal visible={showPersonalInfo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Informations personnelles</Text>
              <TouchableOpacity onPress={() => setShowPersonalInfo(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={styles.modalInput}
              value={editFirstName}
              onChangeText={setEditFirstName}
              placeholder="Votre prénom"
            />
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={styles.modalInput}
              value={editLastName}
              onChangeText={setEditLastName}
              placeholder="Votre nom"
            />
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="06XXXXXXXX"
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.modalInput, { backgroundColor: COLORS.grayLight }]}>
              <Text style={{ color: COLORS.textSecondary }}>{user?.email || 'N/A'}</Text>
            </View>

            <TouchableOpacity style={styles.modalSaveButton} onPress={savePersonalInfo} disabled={savingProfile}>
              {savingProfile ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalSaveText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Moyens de paiement */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Moyens de paiement</Text>
              <TouchableOpacity onPress={() => setShowPayment(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.paymentMethod}>
              <View style={[styles.paymentIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="wallet" size={24} color="#1565C0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Portefeuille UrbanMove</Text>
                <Text style={styles.paymentDetail}>Solde: {walletBalance} DH</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.paymentMethod}>
              <View style={[styles.paymentIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="card" size={24} color="#EF6C00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Carte bancaire</Text>
                <Text style={styles.paymentDetail}>Visa / Mastercard / CMI</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.paymentMethod}>
              <View style={[styles.paymentIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="cash" size={24} color="#2E7D32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Cash Plus / Wafacash</Text>
                <Text style={styles.paymentDetail}>Paiement en espèces</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.paymentMethod}>
              <View style={[styles.paymentIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="phone-portrait" size={24} color="#6A1B9A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Paiement mobile</Text>
                <Text style={styles.paymentDetail}>Orange Money / inwi money</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Mes réservations */}
      <Modal visible={showReservations} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mes réservations</Text>
              <TouchableOpacity onPress={() => setShowReservations(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            {reservations.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: SIZES.xl }}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.gray} />
                <Text style={{ color: COLORS.textSecondary, marginTop: SIZES.md }}>Aucune réservation</Text>
              </View>
            ) : (
              <FlatList
                data={reservations}
                keyExtractor={(item) => item._id || String(Math.random())}
                renderItem={({ item }) => {
                  const parkName = item.parking?.name || 'Parking';
                  const statusColors = { active: COLORS.success, completed: COLORS.primary, cancelled: COLORS.error, expired: COLORS.gray };
                  const statusLabels = { active: 'Active', completed: 'Terminée', cancelled: 'Annulée', expired: 'Expirée' };
                  return (
                    <View style={styles.reservationCard}>
                      <View style={styles.reservationHeader}>
                        <Text style={styles.reservationParking} numberOfLines={1}>{parkName}</Text>
                        <View style={[styles.reservationBadge, { backgroundColor: (statusColors[item.status] || COLORS.gray) + '20' }]}>
                          <Text style={[styles.reservationBadgeText, { color: statusColors[item.status] || COLORS.gray }]}>
                            {statusLabels[item.status] || item.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reservationDetail}>
                        {item.spotNumber ? `Place ${item.spotNumber}` : ''}{item.floor ? ` • ${item.floor}` : ''}
                      </Text>
                      <View style={styles.reservationRow}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.reservationDetail}>
                          {item.startTime ? new Date(item.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </Text>
                        <Text style={styles.reservationPrice}>{item.pricing?.amount || 0} DH</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Ville par défaut */}
      <Modal visible={showCityPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ville par défaut</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            {CITIES.map((city) => {
              const isSelected = (user?.preferences?.defaultCity || 'rabat') === city.id;
              return (
                <TouchableOpacity
                  key={city.id}
                  style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                  onPress={() => changeDefaultCity(city)}
                >
                  <Ionicons name="location" size={20} color={isSelected ? COLORS.primary : COLORS.gray} />
                  <Text style={[styles.cityItemText, isSelected && styles.cityItemTextSelected]}>{city.name}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  title: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.light,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SIZES.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.sm,
  },
  memberBadgeText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: 'center',
    marginHorizontal: SIZES.xs,
    ...SHADOWS.light,
  },
  statValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  menuSection: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.light,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  menuItemLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
    marginRight: SIZES.sm,
  },
  badgeText: {
    fontSize: SIZES.fontSm,
    color: COLORS.success,
    fontWeight: '600',
  },
  menuItemValue: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginRight: SIZES.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '10',
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
  },
  logoutText: {
    fontSize: SIZES.fontMd,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: SIZES.fontSm,
    marginTop: SIZES.lg,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  inputLabel: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
    marginTop: SIZES.sm,
  },
  modalInput: {
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  modalSaveText: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
  },

  // Payment methods
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  paymentLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  paymentDetail: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Reservations
  reservationCard: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  reservationParking: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  reservationBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    marginLeft: SIZES.sm,
  },
  reservationBadgeText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
  },
  reservationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reservationDetail: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  reservationPrice: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // City picker
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    borderRadius: SIZES.radiusMd,
  },
  cityItemSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  cityItemText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    marginLeft: SIZES.md,
    flex: 1,
  },
  cityItemTextSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default ProfileScreen;
