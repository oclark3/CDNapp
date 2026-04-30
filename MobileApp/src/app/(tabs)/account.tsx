import { Text, View, ScrollView, Alert, ActivityIndicator, Pressable, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/hooks/useSession';
import { useRefreshOnTabPress } from '@/hooks/useRefreshOnTabPress';
import { authService } from '@/services/authService';
import { Button, Divider, TextInput } from 'react-native-paper';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'expo-router';
import { useScrollToTop } from "@react-navigation/native";
import LogoHeader from '@/components/LogoHeader';

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

export default function AccountScreen() {
  const listRef = useRef(null);
  const { signOut, accessToken, isLoading: isSessionLoading } = useSession();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleRefresh = useCallback(() => {
    if (accessToken) {
      fetchUserProfile(accessToken);
    }
  }, [accessToken, fetchUserProfile]);

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

    return () => {
      isActive = false;
    };
  }, [accessToken, isSessionLoading, fetchUserProfile]);

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
      <ScrollView ref={listRef} refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#5f249f" />}>
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