// Mock implementation for development
const mockAdmin = {
  auth: () => {
    return {
      verifyIdToken: async (token) => {
        try {
          console.log('Verifying token with mock implementation');
          // Basic JWT decode (not secure, only for development)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
          );

          const payload = JSON.parse(jsonPayload);
          console.log('Decoded payload:', payload);
          
          return {
            uid: payload.user_id || payload.sub,
            email: payload.email,
            name: payload.name || payload.email?.split('@')[0]
          };
        } catch (error) {
          console.error('Mock token verification error:', error);
          throw new Error('Invalid token');
        }
      }
    };
  }
};

console.log('Using mock Firebase admin implementation');
module.exports = mockAdmin; 