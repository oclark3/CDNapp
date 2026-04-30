// Parses req.body, validates required fields, calls service, sends response

import { Request, Response } from 'express';
import {
  changePasswordService,
  createUserService,
  deleteUserService,
  forgotPasswordService,
  logoutService,
  getUserService,
  authenticateService,
} from '../services/user.service';

// Create account
export async function createUser(req: Request, res: Response) {
  try {
    const { email, password, screen_name, ...otherData } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const responseData = await createUserService(email, password, screen_name, otherData);

    res.status(201).json(responseData);
  } catch (error: any) {
    console.error('Create user error:', error.message);
    if (error.message === 'Failed to obtain authentication token from user creation') {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: error.message || 'Failed to create user' });
  }
}

// Delete account
export async function deleteUser(req: Request, res: Response) {
  try {
    const { authtoken } = req.body;

    if (!authtoken) {
      return res.status(400).json({ message: 'authtoken is required' });
    }

    const result = await deleteUserService(authtoken);
    res.json({ success: result });
  } catch (error: any) {
    console.error('Delete user error:', error.message);
    res.status(401).json({ message: error.message || 'Failed to delete user' });
  }
}

// Change password (User is already logged in for this)
export async function changePassword(req: Request, res: Response) {
  try {
    const { authtoken, password, current_password } = req.body;

    if (!authtoken || !password) {
      return res.status(400).json({ message: 'authtoken and password are required' });
    }

    const result = await changePasswordService(authtoken, password, current_password);
    res.json({ success: result });
  } catch (error: any) {
    console.error('Change password error:', error.message);
    res.status(401).json({ message: error.message || 'Failed to change password' });
  }
}

// Send forgot-password email for user to reset password (User is not logged in for this)
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const result = await forgotPasswordService(email);
    res.json({ success: result });
  } catch (error: any) {
    console.error('Forgot password error:', error.message);
    // Return success even on error for security (don't expose if email exists)
    res.json({ success: true });
  }
}

// Get user profile
export async function getUser(req: Request, res: Response) {
  try {
    const { authtoken } = req.body;

    if (!authtoken) {
      return res.status(400).json({ message: 'authtoken is required' });
    }

    const result = await getUserService(authtoken);

    res.json(result);
  } catch (error: any) {
    console.error('Get user error:', error.message);
    res.status(401).json({ message: error.message || 'Failed to fetch user profile' });
  }
}

// Log in (Authenticate) user by email/password and return normalised AuthResult
export async function authenticate(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const result = await authenticateService(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Authenticate error:', error.message);
    res.status(401).json({ message: error.message || 'Failed to authenticate user' });
  }
}

// Logout
// POST /api/v1/user/logout
export async function logout(req: Request, res: Response) {
  try {
    const { authtoken } = req.body;

    if (!authtoken) {
      return res.status(400).json({ message: 'authtoken is required' });
    }

    const result = await logoutService(authtoken);
    res.json({ success: result });
  } catch (error: any) {
    console.error('Logout error:', error.message);
    // Return success even on error for logout (client-side will also clear tokens)
    res.json({ success: true });
  }
}

