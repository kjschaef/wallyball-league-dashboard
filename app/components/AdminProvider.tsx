'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AdminLoginModal } from './AdminLoginModal';

interface AuthContextType {
  isAdmin: boolean;
  login: () => void;
  logout: () => Promise<void>;
  requireAdmin: (callback: () => void | Promise<void>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  login: () => {},
  logout: async () => {},
  requireAdmin: async () => false,
});

export const useAdmin = () => useContext(AuthContext);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => Promise<void>) | null>(null);
  const [cancelCallback, setCancelCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => setIsAdmin(!!data.isAdmin))
      .catch(console.error);
  }, []);

  const login = useCallback(() => {
    setShowModal(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAdmin(false);
    } catch (error) {
      console.error('Failed to logout', error);
    }
  }, []);

  const requireAdmin = useCallback((callback: () => void | Promise<void>): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const executeCallback = async () => {
        try {
          await callback();
          resolve(true);
        } catch (error: any) {
          if (error.message === 'UNAUTHORIZED') {
            setIsAdmin(false);
            setPendingCallback(() => async () => {
              try {
                await callback();
                resolve(true);
              } catch (retryError) {
                reject(retryError);
              }
            });
            setCancelCallback(() => () => resolve(false));
            setShowModal(true);
          } else {
            reject(error);
          }
        }
      };

      if (isAdmin) {
        executeCallback();
      } else {
        setPendingCallback(() => async () => {
          try {
            await callback();
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });
        setCancelCallback(() => () => resolve(false));
        setShowModal(true);
      }
    });
  }, [isAdmin]);

  const handleLoginSuccess = async () => {
    setIsAdmin(true);
    setShowModal(false);
    
    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      setCancelCallback(null);
      await cb();
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setPendingCallback(null);
    if (cancelCallback) {
      cancelCallback();
      setCancelCallback(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, requireAdmin }}>
      {children}
      <AdminLoginModal 
        isOpen={showModal} 
        onClose={handleModalClose} 
        onSuccess={handleLoginSuccess} 
      />
    </AuthContext.Provider>
  );
}
