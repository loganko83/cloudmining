import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateWalletAddress: (address: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for fake JWT
    const storedUser = localStorage.getItem('xphere_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, pass: string) => {
    // Mock login API call
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        if (email && pass) {
          const mockUser: User = {
            id: 'u_123',
            email,
            name: '김채굴',
            role: 'user',
            walletAddress: '',
          };
          setUser(mockUser);
          localStorage.setItem('xphere_user', JSON.stringify(mockUser));
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('xphere_user');
  };

  const updateWalletAddress = (address: string) => {
    if (user) {
        const updatedUser = { ...user, walletAddress: address };
        setUser(updatedUser);
        localStorage.setItem('xphere_user', JSON.stringify(updatedUser));
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateWalletAddress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};