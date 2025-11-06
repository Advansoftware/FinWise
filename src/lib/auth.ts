// src/lib/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required for production');
}

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB || 'gastometria',
  }),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const db = client.db(process.env.MONGODB_DB || 'gastometria');
          const usersCollection = db.collection('users');

          // Encontrar usuário
          const user = await usersCollection.findOne({
            email: credentials.email
          });

          if (!user) {
            return null;
          }

          let isPasswordValid = false;

          // Verificar se é bcrypt (começa com $2)
          if (user.passwordHash && user.passwordHash.startsWith('$2')) {
            isPasswordValid = await bcrypt.compare(
              credentials.password as string,
              user.passwordHash
            );
          }
          // Suporte legado: verificar SHA256
          else if (user.passwordHash) {
            const crypto = require('crypto');
            const sha256Hash = crypto.createHash('sha256')
              .update(credentials.password as string)
              .digest('hex');

            isPasswordValid = sha256Hash === user.passwordHash;

            // Se login for bem-sucedido com SHA256, migrar para bcrypt
            if (isPasswordValid) {
              console.log(`Migrando senha para bcrypt: ${user.email}`);
              const newHash = await bcrypt.hash(credentials.password as string, 10);
              await usersCollection.updateOne(
                { _id: user._id },
                {
                  $set: { passwordHash: newHash },
                  $unset: { oldPasswordHash: "", requirePasswordReset: "" }
                }
              );
            }
          }

          if (!isPasswordValid) {
            return null;
          }

          // Retornar dados do usuário
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.displayName,
            plan: user.plan || 'Básico',
            aiCredits: user.aiCredits || 0,
            stripeCustomerId: user.stripeCustomerId,
            createdAt: user.createdAt,
          };
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Adicionar dados do usuário ao token JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.plan = (user as any).plan;
        token.aiCredits = (user as any).aiCredits;
        token.stripeCustomerId = (user as any).stripeCustomerId;
      }

      // Atualizar token se houver mudanças na sessão
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      // Adicionar dados do token à sessão
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).plan = token.plan;
        (session.user as any).aiCredits = token.aiCredits;
        (session.user as any).stripeCustomerId = token.stripeCustomerId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});
