// src/hooks/use-auth.tsx
"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import {
  useSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (
    email: string,
    password: string,
    name: string
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Usar o hook do NextAuth para gerenciar a sessão
  const { data: session, status, update } = useSession();

  const loading = status === "loading";

  // Converter sessão do NextAuth para UserProfile
  const user: UserProfile | null = session?.user
    ? {
        uid: session.user.id,
        email: session.user.email!,
        displayName: session.user.name || "",
        plan: (session.user as any).plan || "Básico",
        aiCredits: (session.user as any).aiCredits || 0,
        stripeCustomerId: (session.user as any).stripeCustomerId,
        stripeCurrentPeriodEnd: (session.user as any).stripeCurrentPeriodEnd,
        createdAt: new Date().toISOString(), // Será carregado do banco posteriormente se necessário
        image: session.user.image,
      }
    : null;

  const refreshUser = useCallback(async () => {
    try {
      console.log("[useAuth] Starting session refresh...");
      
      // Forçar atualização da sessão - o trigger "update" no callback jwt
      // vai buscar dados frescos do banco de dados
      await update();
      
      // Aguardar um momento para o NextAuth processar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Buscar a sessão atualizada diretamente da API
      const sessionResponse = await fetch("/api/auth/session", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      const sessionData = await sessionResponse.json();
      
      if (sessionData?.user) {
        console.log("[useAuth] Session refreshed successfully!");
        console.log("[useAuth] New plan:", sessionData.user.plan);
        console.log("[useAuth] New credits:", sessionData.user.aiCredits);
        
        return {
          uid: sessionData.user.id,
          email: sessionData.user.email,
          displayName: sessionData.user.name || "",
          plan: sessionData.user.plan || "Básico",
          aiCredits: sessionData.user.aiCredits || 0,
          stripeCustomerId: sessionData.user.stripeCustomerId,
          stripeCurrentPeriodEnd: sessionData.user.stripeCurrentPeriodEnd,
          createdAt: new Date().toISOString(),
          image: sessionData.user.image,
        };
      }
      return null;
    } catch (error) {
      console.error("[useAuth] Error refreshing user:", error);
      return null;
    }
  }, [update]);

  const login = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      try {
        const result = await nextAuthSignIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error || !result?.ok) {
          throw new Error("Email ou senha incorretos");
        }

        // Aguarda a sessão ser atualizada buscando diretamente da API
        let tentativas = 0;
        let usuarioAtualizado: UserProfile | null = null;

        while (tentativas < 15) {
          // Buscar sessão atualizada diretamente da API
          const sessionResponse = await fetch("/api/auth/session");
          const sessionData = await sessionResponse.json();

          if (sessionData?.user?.email === email) {
            usuarioAtualizado = {
              uid: sessionData.user.id,
              email: sessionData.user.email,
              displayName: sessionData.user.name || "",
              plan: sessionData.user.plan || "Básico",
              aiCredits: sessionData.user.aiCredits || 0,
              stripeCustomerId: sessionData.user.stripeCustomerId,
              createdAt: new Date().toISOString(),
              image: sessionData.user.image,
            };
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
          tentativas++;
        }

        // Atualiza o estado local da sessão
        await update();

        if (!usuarioAtualizado) {
          // Mesmo sem conseguir verificar, o login foi bem sucedido
          // Retorna um objeto básico e deixa a sessão carregar naturalmente
          console.warn("Sessão ainda não disponível, redirecionando...");
          return {
            uid: "",
            email: email,
            displayName: "",
            plan: "Básico",
            aiCredits: 0,
            createdAt: new Date().toISOString(),
          };
        }

        return usuarioAtualizado;
      } catch (error: any) {
        console.error("Login error:", error);
        throw error;
      }
    },
    [update]
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ): Promise<UserProfile> => {
      try {
        // Criar usuário no MongoDB
        const response = await fetch("/api/users/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao criar usuário");
        }

        // Fazer login automaticamente após signup
        return await login(email, password);
      } catch (error: any) {
        console.error("Signup error:", error);
        throw error;
      }
    },
    [login]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await nextAuthSignOut({ redirect: false });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<UserProfile>): Promise<void> => {
      if (!user) throw new Error("No user logged in");

      try {
        // Atualizar no banco de dados
        const response = await fetch("/api/users/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, updates }),
        });

        if (!response.ok) {
          throw new Error("Erro ao atualizar usuário");
        }

        // Atualizar sessão
        await update(updates);
      } catch (error) {
        console.error("Update user error:", error);
        throw error;
      }
    },
    [user, update]
  );

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
