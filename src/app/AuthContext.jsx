"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { SAsessionInfo } from "@/lib/serverActions/session/sessionServerActions";

const AuthContext = createContext();

export function AuthProvider({children}){
  const [isAuthenticated, setIsAuthenticated] = useState({
    loading: true,
    userId: null,
    isConnected: false,
  });

  useEffect(() => {
    const fetchSessionInfo = async () => {
      const session = await SAsessionInfo();
      setIsAuthenticated({
        loading: false,
        userId: session.userId,
        isConnected: session.success,
      });
    };  
    fetchSessionInfo();
  }, []);

  return (
    <AuthContext.Provider value={{isAuthenticated, setIsAuthenticated}}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext);
}