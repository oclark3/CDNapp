// Central service for fetching data from the CDN
// Used in both article and user service files

import axios from 'axios';
import { ENV_VARS } from '../config/envVars';

export interface CDNResponse {
    items?: any[];
    [key: string]: any;
}

const SENSITIVE_KEYS = new Set(['authtoken', 'token', 'accessToken', 'authorization', 'password', 'secret', 'apikey', 'apiKey']);

const redactForLog = (value: any): any => {
    if (Array.isArray(value)) {
        return value.map(redactForLog);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entryValue]) => [
                key,
                SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redactForLog(entryValue),
            ])
        );
    }

    return value;
};

export const fetchFromCDN = async (
    url: string, 
    options?: {
        method?: 'GET' | 'POST';
        data?: any;
        params?: any;
    }
): Promise<CDNResponse> => {
    try {
        const method = options?.method || 'GET';
        console.log(`[CDN] Fetching ${method} ${url}`, {
            params: redactForLog(options?.params),
            data: options?.data ? redactForLog(options.data) : undefined,
        });

        const headers: any = {
            accept: 'application/json',
            Authorization: `Basic ${Buffer.from(`${ENV_VARS.WEB_SERVICE_KEY}:${ENV_VARS.WEB_SERVICE_SECRET}`).toString('base64')}`,
        };

        // Add Content-Type for POST requests
        if (method === 'POST') {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        let response;
        if (method === 'POST') {
            // Convert data object to URLSearchParams for form-encoded POST
            const body = new URLSearchParams();
            if (options?.data) {
                Object.entries(options.data).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        body.append(key, String(value));
                    }
                });
            }
            response = await axios.post(url, body, { headers, timeout: 10000 });
        } else {
            response = await axios.get(url, { 
                headers, 
                params: options?.params,
                timeout: 10000 
            });
        }
        
        // console.log(`[CDN] Fetch successful: ${method} ${url}`, {
        //     itemsCount: response.data?.items?.length || 0,
        //     responseKeys: Object.keys(response.data),
        // });
        
        return response.data;
    } catch (error: any) {
        console.error(`[CDN] Fetch error for ${options?.method || 'GET'} ${url}:`, error.message);
        
        // Throw more specific errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            throw new Error('Unauthorized: Invalid credentials or token');
        }
        if (error?.response?.status === 400) {
            throw new Error(error.response.data?.message || 'Bad request');
        }
        if (error?.response?.status === 404) {
            throw new Error('Resource not found');
        }
        throw error;
    }
};