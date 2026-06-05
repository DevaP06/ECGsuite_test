import { useCallback } from 'react';
import AxiosInstance from '../AxiosInstance';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        callback: async (response: { credential: string }) => {
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
            if (payload.token && payload.user) {
              const sessionData = {
                token: payload.token,
                user: payload.user
              };
              localStorage.setItem('ecg:session', JSON.stringify(sessionData));
              localStorage.setItem('token', payload.token);
              localStorage.setItem('user', JSON.stringify(payload.user));
              AxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`;
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

          } catch (err: unknown) {
            const error = err as {
              response?: {
                data?: {
                  error?: string;
                  message?: string;
                };
              };
              message?: string;
            };
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
      const container = document.getElementById(elementId);
      if (window.google && container) {
        try {
          initializeGoogleAuth();

          const render = () => {
            if (!container) return;
            container.innerHTML = '';
            const containerWidth = container.clientWidth || 382;
            // Google caps width between 200px and 400px
            const targetWidth = Math.min(Math.max(containerWidth, 200), 400);

            window.google.accounts.id.renderButton(
              container,
              {
                theme: 'outline',
                size: 'large',
                width: targetWidth.toString(),
                text: buttonText,
                shape: 'rectangular',
                logo_alignment: 'left'
              }
            );
          };

          render();

          // Responsive resize handler
          let timeoutId: NodeJS.Timeout;
          const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              const currentElement = document.getElementById(elementId);
              if (currentElement) {
                render();
              } else {
                window.removeEventListener('resize', handleResize);
              }
            }, 150);
          };

          window.addEventListener('resize', handleResize);
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