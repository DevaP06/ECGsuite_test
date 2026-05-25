import { useCallback } from 'react';
import AxiosInstance from '../AxiosInstance';

declare global {
  interface Window {
    google: any;
  }
}

export const useGoogleAuth = () => {
  const loadGoogleScript = useCallback((onLoad: () => void) => {
    if (window.google) {
      onLoad();
      return;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', onLoad, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = onLoad;
    document.head.appendChild(script);
  }, []);

  const initializeGoogleAuth = useCallback(() => {
    console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            console.log('Google response received:', response);

            // Send the credential to your backend
            const result = await AxiosInstance.post('/api/auth/google', {
              credential: response.credential
            });

            console.log('Backend response:', result.data);

            // Backend uses a standard envelope: { success, message, data }
            const resp = result.data;
            const payload = resp.data || {};

            // Store token and user so frontend can authenticate subsequent requests
            if (payload.token) {
              localStorage.setItem('token', payload.token);
              AxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`;
            }

            if (payload.user) {
              localStorage.setItem('user', JSON.stringify(payload.user));
            }

            // Show success message
            const message = resp.message;
            const isNewUser = payload.isNewUser || false;

            // Create and show a temporary success message
            const messageDiv = document.createElement('div');
            messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-md text-white font-medium transition-all duration-300 ${isNewUser ? 'bg-green-600' : 'bg-blue-600'
              }`;
            messageDiv.textContent = message;
            document.body.appendChild(messageDiv);

            // Remove message after 3 seconds and redirect
            setTimeout(() => {
              messageDiv.remove();
              window.location.href = '/';
            }, 3000);

          } catch (error: any) {
            console.error('Google authentication failed:', error);

            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'fixed top-4 right-4 z-50 p-4 rounded-md bg-red-600 text-white font-medium max-w-md';

            // Simple error message handling
            let errorMessage = 'Google authentication failed. Please try again.';

            if (error.response?.data?.error && typeof error.response.data.error === 'string') {
              errorMessage = error.response.data.error;
            } else if (error.response?.data?.message && typeof error.response.data.message === 'string') {
              errorMessage = error.response.data.message;
            } else if (error.message && typeof error.message === 'string') {
              errorMessage = error.message;
            }

            errorDiv.textContent = errorMessage;
            document.body.appendChild(errorDiv);

            setTimeout(() => {
              errorDiv.remove();
            }, 3000);
          }
        }
      });
    }
  }, []);

  const renderGoogleButton = useCallback((elementId: string, buttonText: 'signin_with' | 'signup_with' = 'signin_with') => {
    const checkAndRender = () => {
      if (window.google && document.getElementById(elementId)) {
        try {
          initializeGoogleAuth();
          window.google.accounts.id.renderButton(
            document.getElementById(elementId),
            {
              theme: 'filled_blue',
              size: 'large',
              width: '100%',
              text: buttonText,
              shape: 'rectangular'
            }
          );
          console.log('Google button rendered successfully');
        } catch (error) {
          console.error('Error rendering Google button:', error);
        }
      } else {
        // Retry after a short delay
        setTimeout(checkAndRender, 100);
      }
    };

    loadGoogleScript(checkAndRender);
  }, [initializeGoogleAuth, loadGoogleScript]);

  return { renderGoogleButton };
};