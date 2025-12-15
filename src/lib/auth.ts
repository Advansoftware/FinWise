// src/lib/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient, MongoClientOptions } from "mongodb";
import bcrypt from "bcryptjs";

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required for production');
}

// Opções de conexão para MongoDB Atlas
const uri = process.env.MONGODB_URI;
const isAtlas = uri.includes('mongodb.net') || uri.includes('mongodb+srv');
const mongoOptions: MongoClientOptions = isAtlas ? {
  tls: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
} : {};

const client = new MongoClient(uri, mongoOptions);
const clientPromise = client.connect();

// Determinar se estamos em produção (HTTPS)
const useSecureCookies = process.env.NODE_ENV === 'production';
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
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
        token.stripeCurrentPeriodEnd = (user as any).stripeCurrentPeriodEnd;
      }

      // Atualizar token se houver mudanças na sessão (trigger manual)
      if (trigger === "update") {
        // Se session tem dados, usar esses dados
        if (session) {
          token = { ...token, ...session };
        }

        // Sempre buscar dados frescos do banco quando update é chamado
        try {
          const db = client.db(process.env.MONGODB_DB || 'gastometria');
          const usersCollection = db.collection('users');
          const { ObjectId } = require('mongodb');

          const freshUser = await usersCollection.findOne({
            _id: new ObjectId(token.id)
          });

          if (freshUser) {
            token.plan = freshUser.plan || 'Básico';
            token.aiCredits = freshUser.aiCredits || 0;
            token.stripeCustomerId = freshUser.stripeCustomerId;
            token.stripeCurrentPeriodEnd = freshUser.stripeCurrentPeriodEnd;
            console.log(`[Auth] Session refreshed for user ${token.id}, plan: ${token.plan}`);
          }
        } catch (error) {
          console.error('[Auth] Error refreshing user data:', error);
        }
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
        (session.user as any).stripeCurrentPeriodEnd = token.stripeCurrentPeriodEnd;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});
