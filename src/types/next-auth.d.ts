// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan?: string;
      aiCredits?: number;
      stripeCustomerId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    plan?: string;
    aiCredits?: number;
    stripeCustomerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    plan?: string;
    aiCredits?: number;
    stripeCustomerId?: string;
  }
}
