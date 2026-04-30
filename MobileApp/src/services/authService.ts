// Auth service to handle user authentication API calls

import axios from 'axios';
import { AuthResponse } from '@/types/types';
import { setStorageItemAsync } from '@/hooks/useStorageState';
import { buildApiUrl } from './apiConfig';

export const authService = {
  /**
   * Register a new user account
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(buildApiUrl('/api/v1/user/create'), {
        email,
        password,
        return_auth: true,
      });

      const payload = response.data as AuthResponse;
      if (!payload?.accessToken) {
        throw new Error('Authentication token not returned');
      }

      return payload;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      console.error('Registration error:', message);
      throw new Error(message);
    }
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(buildApiUrl('/api/v1/user/authenticate'), {
        email,
        password,
      });

      const payload = response.data as AuthResponse;
      if (!payload?.accessToken) {
        throw new Error('Authentication token not returned');
      }

      return payload;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      console.error('Login error:', message);
      throw new Error(message);
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(accessToken: string) {
    try {
      const response = await axios.post(buildApiUrl('/api/v1/user/profile'), {
        authtoken: accessToken,
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to fetch profile (${error.response?.status})`;
      console.error('Profile fetch error:', message);
      throw new Error(message);
    }
  },

  /**
   * Change user password
   */
  async changePassword(accessToken: string, newPassword: string, currentPassword?: string) {
    try {
      const response = await axios.post(buildApiUrl('/api/v1/user/change-password'), {
        authtoken: accessToken,
        password: newPassword,
        current_password: currentPassword,
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change password';
      console.error('Change password error:', message);
      throw new Error(message);
    }
  },

  // /**
  //  * Change user screen name
  //  */
  // async changeScreenName(accessToken: string, newScreenName: string) {
  //   try {
  //     const response = await fetch(buildApiUrl('/api/v1/user/change-screen-name'), {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         authtoken: accessToken,
  //         screen_name: newScreenName,
  //       }),
  //     });

  //     if (!response.ok) {
  //       const error = await response.json();
  //       throw new Error(error.message || 'Failed to change screen name');
  //     }

  //     return await response.json();
  //   } catch (error) {
  //     console.error('Change screen name error:', error);
  //     throw error;
  //   }
  // },

  /**
   * Update user profile
   */
  async updateProfile(accessToken: string, userData: any) {
    try {
      const response = await axios.post(buildApiUrl('/api/v1/user/update'), {
        authtoken: accessToken,
        ...userData,
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      console.error('Update profile error:', message);
      throw new Error(message);
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(accessToken: string) {
    try {
      const response = await axios.post(buildApiUrl('/api/v1/user/delete'), {
        authtoken: accessToken,
      });

      // Clear stored data after successful deletion
      await setStorageItemAsync('accessToken', null);
      await setStorageItemAsync('user', null);

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete account';
      console.error('Delete account error:', message);
      throw new Error(message);
    }
  },

  /**
   * Send password reset email
   */
  async forgotPassword(email: string) {
    try {
      const response = await axios.post(buildApiUrl('/api/v1/user/forgot-password'), {
        email,
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send password reset email';
      console.error('Forgot password error:', message);
      throw new Error(message);
    }
  },

  /**
   * Logout and clear stored tokens
   */
  async logout(accessToken?: string): Promise<void> {
    try {
      // Call logout API if token is provided
      if (accessToken) {
        try {
          await axios.post(buildApiUrl('/api/v1/user/logout'), {
            authtoken: accessToken,
          });
        } catch {
          console.error('Logout API call failed');
          // Continue to clear local tokens even if API call fails
        }
      }

      // Clear stored tokens
      await setStorageItemAsync('accessToken', null);
      await setStorageItemAsync('user', null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

};