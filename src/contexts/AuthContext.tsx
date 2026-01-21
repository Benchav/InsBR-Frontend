import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { authApi, LoginRequest, User } from '@/api/auth.api';
import { saveAuthToken, saveUserData, getUserData, clearStorage } from '@/utils/storage';
import { useBranchStore, BranchId } from '@/stores/branchStore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentBranch } = useBranchStore();

  const mapUserBranchId = (branchId?: string): BranchId => {
    if (!branchId) return 'diriamba';
    const normalized = branchId.toLowerCase();
    if (normalized.includes('diri') || normalized.includes('dir')) return 'diriamba';
    if (normalized.includes('jino') || normalized.includes('jin')) return 'jinotepe';
    return 'diriamba';
  };

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      setCurrentBranch(mapUserBranchId(user.branchId));
    }
  }, [user, setCurrentBranch]);

  const login = async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    saveAuthToken(response.token);
    saveUserData(response.user);
    setUser(response.user);
  };

  const logout = () => {
    clearStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
