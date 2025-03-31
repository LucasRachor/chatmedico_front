import { decodeJwtToken } from './jwt';

interface AuthResponse {
  message: string;
  user: {
    id: string;
    username: string;
    role: string;
  }

}

export const verifyToken = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');

  if (!token) {
    return false;
  }

  try {
    const response = await fetch('http://localhost:4000/api/v1/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      logout();
      return false;
    }

    const data: AuthResponse = await response.json();
    localStorage.setItem('role', data.user.role);

    return true;
  } catch (error) {
    logout();
    return false;
  }
};

export const getAuthData = (): { token: string | null; role: string | null } => {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role')
  };
};

export const isAuthenticated = async (): Promise<boolean> => {
  const { token, role } = getAuthData();

  if (!token || !role) {
    return false;
  }

  const decodedToken = decodeJwtToken(token);
  if (!decodedToken) {
    logout();
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (decodedToken.exp < currentTime) {
    logout();
    return false;
  }

  if (decodedToken.role !== role) {
    logout();
    return false;
  }

  return await verifyToken();
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/';
};
