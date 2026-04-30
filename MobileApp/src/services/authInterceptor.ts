// To logout user if an API response returns 401 Unauthorized, indicating the access token is invalid or expired

import axios, { AxiosError } from 'axios';

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let interceptorInstalled = false;

const shouldIgnoreUnauthorizedError = (error: AxiosError) => {
  const requestUrl = error.config?.url ?? '';
  return requestUrl.includes('/api/v1/user/logout');
};

const ensureInterceptorInstalled = () => {
  if (interceptorInstalled) {
    return;
  }

  axios.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && unauthorizedHandler && !shouldIgnoreUnauthorizedError(error)) {
        void Promise.resolve(unauthorizedHandler()).catch((handlerError) => {
          console.error('Unauthorized handler failed:', handlerError);
        });
      }

      return Promise.reject(error);
    }
  );

  interceptorInstalled = true;
};

export const registerUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  ensureInterceptorInstalled();
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
};