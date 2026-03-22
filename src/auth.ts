import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Generate a stable secret for development (in production, use AUTH_SECRET env var)
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "kamal-saad-auth-secret-key-2024-secure";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google' && profile?.email) {
        try {
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          });

          // Create user if doesn't exist
          if (!existingUser) {
            existingUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || user.name || '',
                image: profile.picture || user.image,
                role: 'customer',
                emailVerified: new Date(),
              }
            });
          } else {
            // Update existing user's image if needed
            if (profile.picture && existingUser.image !== profile.picture) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { image: profile.picture }
              });
            }
          }

          // Update user object with database info
          user.id = existingUser.id;
          (user as any).role = existingUser.role;

          console.log('Google sign in successful:', { 
            userId: existingUser.id, 
            email: existingUser.email,
            role: existingUser.role 
          });

          return true;
        } catch (error) {
          console.error("Google sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;

        // For Google login, get user from database
        if (account?.provider === 'google') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
          }
        }
      }
      
      // Handle session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log('Sign in event:', { 
        userId: user.id, 
        provider: account?.provider,
        email: user.email 
      });
    },
    async signOut({ token }) {
      console.log('Sign out event:', { userId: token?.id });
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
