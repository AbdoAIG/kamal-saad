import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Use AUTH_SECRET (NextAuth v5) or fallback to NEXTAUTH_SECRET (v4)
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!secret) {
  console.error("WARNING: No AUTH_SECRET or NEXTAUTH_SECRET found in environment!");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
  trustHost: true,
  
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Pages configuration
  pages: {
    signIn: "/",
    error: "/",
  },
  
  // Providers
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          scope: "openid email profile"
        }
      }
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
  
  // Callbacks
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[AUTH] signIn callback triggered", { 
        provider: account?.provider, 
        email: profile?.email 
      });
      
      // Handle Google OAuth
      if (account?.provider === 'google' && profile?.email) {
        try {
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          });

          if (!existingUser) {
            // Create new user
            console.log("[AUTH] Creating new user for Google OAuth:", profile.email);
            existingUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || user.name || '',
                image: (profile as any).picture || user.image || null,
                role: 'customer',
                emailVerified: new Date(),
              }
            });
            console.log("[AUTH] New user created:", existingUser.id);
          } else {
            console.log("[AUTH] Existing user found:", existingUser.id);
          }

          // Update user object with database info
          user.id = existingUser.id;
          (user as any).role = existingUser.role;
          
          return true;
        } catch (error) {
          console.error("[AUTH] Google sign in error:", error);
          return false;
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        console.log("[AUTH] JWT callback - initial sign in for user:", user.id);
        token.id = user.id;
        token.role = (user as any).role;

        // For Google OAuth, fetch fresh user data
        if (account?.provider === 'google') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.image;
          }
        }
      }
      
      // Handle session update
      if (trigger === "update" && session) {
        console.log("[AUTH] JWT callback - session update");
        token = { ...token, ...session };
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      console.log("[AUTH] Redirect callback", { url, baseUrl });
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      
      // Default redirect to baseUrl
      return baseUrl;
    },
  },
  
  // Events for debugging
  events: {
    async signIn(message) {
      console.log("[AUTH EVENT] User signed in:", message.user?.email);
    },
    async signOut(message) {
      console.log("[AUTH EVENT] User signed out");
    },
    async session(message) {
      // Session is being accessed
    },
  },
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
});
