// Auth utility functions for handling access and refresh tokens

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  user_id: number;
  name: string;
  email: string;
  account_balance: number;
  total_earning: number;
  rewards: number;
}

// Store tokens in localStorage (in production, use httpOnly cookies)
export const setTokens = (tokens: AuthTokens) => {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

export const getTokens = (): AuthTokens | null => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken || !refreshToken) {
    return null;
  }
  
  return { accessToken, refreshToken };
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const setUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Check if token is expired (basic check, not cryptographically secure)
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true; // If we can't parse, consider it expired
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (): Promise<string | null> => {
  const tokens = getTokens();
  if (!tokens) return null;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      const newAccessToken = data.data.accessToken;
      
      // Update stored access token
      localStorage.setItem('accessToken', newAccessToken);
      
      return newAccessToken;
    } else {
      // Refresh failed, clear tokens and redirect to login
      clearTokens();
      window.location.href = '/login';
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearTokens();
    window.location.href = '/login';
    return null;
  }
};

// Fetch with automatic token refresh
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let tokens = getTokens();
  
  if (!tokens) {
    // No tokens, redirect to login
    window.location.href = '/login';
    throw new Error('No authentication tokens');
  }

  // Check if access token is expired
  if (isTokenExpired(tokens.accessToken)) {
    console.log('Access token expired, refreshing...');
    const newAccessToken = await refreshAccessToken();
    
    if (!newAccessToken) {
      throw new Error('Failed to refresh access token');
    }
    
    tokens = getTokens(); // Get updated tokens
  }

  // Make the request with the access token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${tokens!.accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // If we get 401, try to refresh the token once more
  if (response.status === 401) {
    console.log('Received 401, attempting token refresh...');
    const newAccessToken = await refreshAccessToken();
    
    if (newAccessToken) {
      // Retry the original request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } else {
      // Refresh failed, user will be redirected to login
      throw new Error('Authentication failed');
    }
  }

  return response;
};

// Login function
export const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store tokens and user data
      setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      setUser(data.data.user);
      
      return { success: true, user: data.data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error during login' };
  }
};

// Logout function
export const logout = () => {
  clearTokens();
  window.location.href = '/login';
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const tokens = getTokens();
  const user = getUser();
  
  if (!tokens || !user) return false;
  
  // Check if access token is expired
  if (isTokenExpired(tokens.accessToken)) {
    // Try to refresh silently
    refreshAccessToken().catch(() => {
      // If refresh fails, user will be redirected to login
    });
    return true; // Return true for now, refresh will handle the redirect
  }
  
  return true;
};
