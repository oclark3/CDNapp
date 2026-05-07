import { Text, View, ScrollView, Alert, ActivityIndicator, Pressable, Modal, RefreshControl, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/hooks/useSession';
import { useRefreshOnTabPress } from '@/hooks/useRefreshOnTabPress';
import { authService } from '@/services/authService';
import { Button, Divider, TextInput } from 'react-native-paper';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'expo-router';
import { useScrollToTop } from "@react-navigation/native";
import LogoHeader from '@/components/LogoHeader';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';

interface UserProfile {
  id: string;
  email: string;
  screenname?: string;
  screen_name?: string;
  first_name?: string;
  last_name?: string;
  about?: string;
  avatar_url?: string;
  birthday?: string;
  phone_number?: string;
  address?: string;
}

type CustomerInfo = Awaited<ReturnType<typeof Purchases.getCustomerInfo>>;
type EntitlementInfo = CustomerInfo['entitlements']['active'][string];

function formatDate(value?: string | null) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function AccountScreen() {
  const listRef = useRef(null);
  const { signOut, accessToken, isLoading: isSessionLoading } = useSession();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerInfoLoading, setCustomerInfoLoading] = useState(false);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useScrollToTop(listRef);

  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      setLoading(true);
      const profile = await authService.getProfile(token);
      return profile;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomerInfo = useCallback(async () => {
    if (Platform.OS === 'web') {
      setCustomerInfo(null);
      return null;
    }

    try {
      setCustomerInfoLoading(true);
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      console.error('Error fetching RevenueCat customer info:', error);
      setCustomerInfo(null);
      return null;
    } finally {
      setCustomerInfoLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (accessToken) {
      fetchUserProfile(accessToken);
      void fetchCustomerInfo();
    }
  }, [accessToken, fetchCustomerInfo, fetchUserProfile]);

  useRefreshOnTabPress(() => {
    handleRefresh();
  });

  // Fetch user profile when session is ready and token is available
  useEffect(() => {
    let isActive = true;

    if (isSessionLoading) {
      setLoading(true);
      return () => {
        isActive = false;
      };
    }

    if (!accessToken) {
      setUserProfile(null);
      setCustomerInfo(null);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    const loadProfile = async () => {
      const profile = await fetchUserProfile(accessToken);
      if (!isActive || !profile) return;

      setUserProfile(profile);
    };

    loadProfile();
    void fetchCustomerInfo();

    return () => {
      isActive = false;
    };
  }, [accessToken, isSessionLoading, fetchCustomerInfo, fetchUserProfile]);

  const activeEntitlements = Object.values(customerInfo?.entitlements?.active ?? {});

  const handleManageSubscription = useCallback(async () => {
    try {
      setSubscriptionActionLoading(true);

      if (Platform.OS === 'web') {
        const webUrl = customerInfo?.managementURL;
        if (webUrl) {
          await Linking.openURL(webUrl);
          return;
        }

        Alert.alert('Manage Subscription', 'No subscription management link is available for this account.');
        return;
      }

      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.error('Error opening RevenueCat customer center:', error);

      const fallbackUrl = customerInfo?.managementURL;
      if (fallbackUrl) {
        try {
          await Linking.openURL(fallbackUrl);
          return;
        } catch (linkError) {
          console.error('Error opening fallback subscription URL:', linkError);
        }
      }

      Alert.alert('Manage Subscription', 'Unable to open the subscription manager right now.');
    } finally {
      setSubscriptionActionLoading(false);
    }
  }, [customerInfo?.managementURL]);

  const renderEntitlementRow = (label: string, value: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
      <Text style={{ fontSize: 13, color: '#666', flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#000', fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );

  const renderEntitlementCard = (entitlement: EntitlementInfo) => (
    <View key={entitlement.identifier} style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8, marginBottom: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 12 }}>{entitlement.identifier}</Text>
      {renderEntitlementRow('Status', entitlement.isActive ? 'Active' : 'Inactive')}
      {renderEntitlementRow('Will renew', entitlement.willRenew ? 'Yes' : 'No')}
      {renderEntitlementRow('Expiration', formatDate(entitlement.expirationDate))}
      {renderEntitlementRow('Latest purchase', formatDate(entitlement.latestPurchaseDate))}
      {renderEntitlementRow('Product', entitlement.productIdentifier)}
      {renderEntitlementRow('Store', entitlement.store)}
      {renderEntitlementRow('Ownership', entitlement.ownershipType)}
      {renderEntitlementRow('Billing issue', entitlement.billingIssueDetectedAt ? formatDate(entitlement.billingIssueDetectedAt) : 'None')}
      {renderEntitlementRow('Unsubscribed at', entitlement.unsubscribeDetectedAt ? formatDate(entitlement.unsubscribeDetectedAt) : 'None')}
    </View>
  );

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      if (!accessToken) throw new Error('No access token');
      
      await authService.changePassword(accessToken, newPassword, currentPassword);
      Alert.alert('Success', 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!accessToken) {
        console.error('No access token available');
        Alert.alert('Error', 'No access token found. Please try logging in again.');
        return;
      }
      
      await authService.deleteAccount(accessToken);
      Alert.alert('Success', 'Account deleted successfully');
      await signOut();
    } catch (error: any) {
      console.error('Delete account error');
      Alert.alert('Error', error.message || 'Failed to delete account');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }} edges={["top"]}>
        <ActivityIndicator size="large" color='#5f249f' />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={["top"]}>
      <ScrollView ref={listRef} refreshControl={<RefreshControl refreshing={loading || customerInfoLoading} onRefresh={handleRefresh} tintColor="#5f249f" />}>
        <LogoHeader />
        <View style={{ padding: 16, marginBottom: 20 }}>
          {/* Header */}
        <Text style={{ fontSize: 28, fontWeight: 'bold'}}>Account</Text>

        <Text style={{ fontSize: 16, color: '#555', marginBottom: 30 }}>To change your info or sign up for newsletters, go to your account on the website: {"\n"}
          <Link href="https://www.collinsvilledailynews.com/users/login/?referer_url=https%3A%2F%2Fwww.collinsvilledailynews.com%2F" asChild>
            <Text style={{ fontSize: 16, color: '#5f249f', marginBottom: 30 }}>https://www.collinsvilledailynews.com</Text>
          </Link>
        </Text>

        {/* Email Section */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{ fontSize: 14, color: '#999', marginBottom: 8, fontWeight: '600' }}>Email</Text>
          <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8 }}>
            <Text style={{ fontSize: 16, color: '#000' }}>{userProfile?.email}</Text>
          </View>
        </View>

        <Divider />

        {/* Subscription Section */}
        <View style={{ marginVertical: 25 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#666', fontWeight: '600' }}>SUBSCRIPTION & ENTITLEMENTS</Text>
            <Button
              mode="text"
              onPress={handleManageSubscription}
              loading={subscriptionActionLoading}
              disabled={subscriptionActionLoading}
              labelStyle={{ color: '#5f249f', fontSize: 12 }}
            >
              Manage
            </Button>
          </View>

          {customerInfoLoading && !customerInfo ? (
            <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#5f249f" />
              <Text style={{ marginTop: 10, color: '#666' }}>Loading subscription details...</Text>
            </View>
          ) : customerInfo ? (
            <View>
              <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 12 }}>Summary</Text>
                {renderEntitlementRow('Active entitlements', String(activeEntitlements.length))}
                {renderEntitlementRow('Active subscriptions', customerInfo.activeSubscriptions.length > 0 ? customerInfo.activeSubscriptions.join(', ') : 'None')}
                {renderEntitlementRow('Management URL', customerInfo.managementURL || 'Unavailable')}
                {renderEntitlementRow('Original app user ID', customerInfo.originalAppUserId)}
              </View>

              {activeEntitlements.length > 0 ? (
                activeEntitlements.map(renderEntitlementCard)
              ) : (
                <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8 }}>
                  <Text style={{ fontSize: 14, color: '#000', fontWeight: '600', marginBottom: 6 }}>No active entitlements</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>
                    This account does not currently have an active RevenueCat entitlement.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8 }}>
              <Text style={{ fontSize: 14, color: '#666' }}>
                Subscription details are unavailable right now.
              </Text>
            </View>
          )}
        </View>

        <Divider />

        {/* Username Section */}
        <View style={{ marginVertical: 25 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#999', fontWeight: '600' }}>Username</Text>
          </View>

          <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8 }}>
              <Text style={{ fontSize: 16, color: '#000' }}>@{userProfile?.screenname || userProfile?.screen_name || ''}</Text>
            </View>
        </View>

        <Divider />       

        {/* Profile Section */}
        <View style={{ marginVertical: 25 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#999', fontWeight: '600' }}>Profile</Text>
          </View>

          <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8 }}>
              <Text style={{ fontSize: 14, color: '#000', marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Name: </Text>
                {userProfile?.first_name} {userProfile?.last_name}
              </Text>
            </View>
        </View>

        <Divider />



        {/* Password Section */}
        <View style={{ marginVertical: 25 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#666', fontWeight: '600' }}>PASSWORD</Text>
            <Button
              mode="text"
              onPress={() => setShowPasswordForm(!showPasswordForm)}
              labelStyle={{ color: '#5f249f', fontSize: 12 }}
            >
              {showPasswordForm ? 'Cancel' : 'Change'}
            </Button>
          </View>

          {showPasswordForm && (
            <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8 }}>
              <TextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                mode="outlined"
                outlineColor="#CCCCCC"
                activeOutlineColor="#5f249f"
                style={{ marginBottom: 12 }}
              />
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                mode="outlined"
                outlineColor="#CCCCCC"
                activeOutlineColor="#5f249f"
                style={{ marginBottom: 12 }}
              />
              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                mode="outlined"
                outlineColor="#CCCCCC"
                activeOutlineColor="#5f249f"
                style={{ marginBottom: 20 }}
              />
              <Button
                mode="contained"
                onPress={handlePasswordChange}
                loading={changingPassword}
                disabled={changingPassword}
                style={{ paddingVertical: 6, backgroundColor: '#5f249f' }}
              >
                Update Password
              </Button>
            </View>
          )}
        </View>

        <Divider />

        {/* Logout Button */}
        <View style={{ marginTop: 25, marginBottom: 10 }}>
          <Pressable
            onPress={() => setShowLogoutModal(true)}
            style={{ justifyContent: 'center' }}
          >
            <Button style={{ width: '70%', alignSelf: 'center' }}>
              <Text style={{ color: '#5f249f', textAlign: 'center', fontWeight: 'bold' }}>Logout</Text>
            </Button>
          </Pressable>
        </View>

        {/* Delete Account Button */}
        <View style={{ marginBottom: 40 }}>
          <Pressable
            onPress={() => setShowDeleteModal(true)}
            style={{ justifyContent: 'center' }}
          >
            <Button style={{ width: '70%', alignSelf: 'center' }}>
              <Text style={{ color: '#FC3C44', textAlign: 'center', fontWeight: 'bold' }}>Delete Account</Text>
            </Button>
          </Pressable>
        </View>

        {/* Logout Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showLogoutModal}
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, width: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Logout</Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 30 }}>Are you sure you want to logout?</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <Button
                  mode="outlined"
                  onPress={() => setShowLogoutModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  buttonColor="#5f249f"
                >
                  Logout
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Account Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showDeleteModal}
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, width: '80%' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#FC3C44' }}>Delete Account</Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 30 }}>
                This action cannot be undone. All your data will be permanently deleted. Are you sure?
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <Button
                  mode="outlined"
                  onPress={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setShowDeleteModal(false);
                    handleDeleteAccount();
                  }}
                  buttonColor="#FC3C44"
                >
                  Delete
                </Button>
              </View>
            </View>
          </View>
        </Modal>         

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}