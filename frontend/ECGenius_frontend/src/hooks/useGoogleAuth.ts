import { useCallback, useEffect } from 'react';
import AxiosInstance from '../AxiosInstance';

declare global {
  interface Window {
    google: any;
  }
}

export const useGoogleAuth = () => {
  const initializeGoogleAuth = useCallback(() => {
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

            // Store user data
            localStorage.setItem('user', JSON.stringify(result.data.user));
            
            // Show success message
            const message = result.data.message;
            const isNewUser = result.data.isNewUser;
            
            // Create and show a temporary success message
            const messageDiv = document.createElement('div');
            messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-md text-white font-medium transition-all duration-300 ${
              isNewUser ? 'bg-green-600' : 'bg-blue-600'
            }`;
            messageDiv.textContent = message;
            document.body.appendChild(messageDiv);
            
            // Remove message after 3 seconds and redirect
            setTimeout(() => {
              messageDiv.remove();
              window.location.href = '/';
            }, 3000);
            
          } catch (error) {
            console.error('Google authentication failed:', error);
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'fixed top-4 right-4 z-50 p-4 rounded-md bg-red-600 text-white font-medium';
            errorDiv.textContent = 'Google authentication failed. Please try again.';
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
    
    checkAndRender();
  }, [initializeGoogleAuth]);

  return { renderGoogleButton };
};