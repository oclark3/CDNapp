import { fetchFromCDN } from './cdn.service';
import { ENV_VARS } from '../config/envVars';

const AUTHENTICATE_ENDPOINT = '/user/authenticate/';
const CHANGE_PASSWORD_ENDPOINT = '/user/change_password/';
const CREATE_USER_ENDPOINT = '/user/create/';
const DELETE_USER_ENDPOINT = '/user/delete/';
const FORGOT_PASSWORD_ENDPOINT = '/user/forgot_password/';
const GET_USER_ENDPOINT = '/user/get/';
const LOGOUT_ENDPOINT = '/user/logout/';
const USER_BASE_URL = ENV_VARS.WEB_SERVICE_BASE;

export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; name: string };
}

// Create account and return a normalised AuthResult
// Handle token extraction and response shape transformation
export async function createUserService(
    email: string,
    password: string,
    screen_name?: string,
    otherData?: Record<string, any>
): Promise<AuthResult> {
    const url = USER_BASE_URL + CREATE_USER_ENDPOINT;
    const result = await fetchFromCDN(url, {
        method: 'POST',
        data: { email, password, screen_name, ...otherData },
    });

    // Do not log tokens to prevent accidental exposure in logs/APM
    const externalAuthToken = result?.authtoken?.value || result?.authtoken || '';
    const externalPublicToken = result?.publictoken?.value || result?.publictoken || '';
    const screenname =
        result?.screenname || result?.screen_name || screen_name || email.split('@')[0];

    if (!externalAuthToken && !externalPublicToken) {
        throw new Error('Failed to obtain authentication token from user creation');
    }

    return {
        accessToken: externalAuthToken || externalPublicToken,
        refreshToken: externalPublicToken || externalAuthToken || '',
        user: {
            id: result?.id || email,
            email,
            name: screenname,
        },
    };
}

// Delete account
export async function deleteUserService(authtoken: string) {
    const url = USER_BASE_URL + DELETE_USER_ENDPOINT;
    return await fetchFromCDN(url, {
        method: 'POST',
        data: { authtoken },
    });
}

// Change password (User is already logged in for this)
export async function changePasswordService(
    authtoken: string,
    password: string,
    current_password?: string
) {
    const url = USER_BASE_URL + CHANGE_PASSWORD_ENDPOINT;
    return await fetchFromCDN(url, {
        method: 'POST',
        data: { authtoken, password, current_password },
    });
}

// Send forgot-password email for user to reset password (User is not logged in for this)
export async function forgotPasswordService(email: string) {
    const url = USER_BASE_URL + FORGOT_PASSWORD_ENDPOINT;
    return await fetchFromCDN(url, {
        method: 'POST',
        data: { user: email },
    });
}

// Fetch user's full profile
export async function getUserService(authtoken: string) {
    const url = `${USER_BASE_URL}${GET_USER_ENDPOINT}`;
    return await fetchFromCDN(url, {
        method: 'POST',
        data: { authtoken },
    });
}

// Log in (Authenticate) user by email/password and return normalised AuthResult
// Handles token extraction and validates the external API response.
export async function authenticateService(email: string, password: string): Promise<AuthResult> {
    const url = USER_BASE_URL + AUTHENTICATE_ENDPOINT;
    const externalUser = await fetchFromCDN(url, {
        method: 'POST',
        data: { user: email, password },
    });

    if (
        !externalUser ||
        (!externalUser.authtoken?.value &&
            !externalUser.publictoken?.value &&
            !externalUser.id)
    ) {
        throw new Error('Invalid email or password');
    }

    const screenname =
        externalUser.screenname || externalUser.screen_name || email.split('@')[0];
    const accessToken =
        externalUser.authtoken?.value || externalUser.publictoken?.value;
    const refreshToken =
        externalUser.publictoken?.value || externalUser.authtoken?.value || '';

    if (!accessToken) {
        throw new Error('Authentication token not returned');
    }

    return {
        accessToken,
        refreshToken,
        user: {
            id: externalUser.id || email,
            email,
            name: screenname || '',
        },
    };
}

// Logs out an authenticated user by invalidating their authtoken
export async function logoutService(authtoken: string) {
    const url = USER_BASE_URL + LOGOUT_ENDPOINT;
    return await fetchFromCDN(url, {
        method: 'POST',
        data: { authtoken },
    });
}

