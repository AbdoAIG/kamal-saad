import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

// Custom error for unverified email
class UnverifiedEmailError extends AuthError {
  constructor(message: string) {
    super(message);
    this.name = "UnverifiedEmailError";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Secret for signing cookies
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  // Trust the host in production
  trustHost: true,

  // Use JWT sessions
  session: {
    strategy: "jwt",
  },

  // Custom pages
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new UnverifiedEmailError("يرجى التحقق من بريدك الإلكتروني أولاً");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  // Callbacks
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth
      if (account?.provider === 'google' && profile?.email) {
        try {
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          });

          if (existingUser) {
            // Update email verification if needed
            if (!existingUser.emailVerified) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { emailVerified: new Date() }
              });
            }
          } else {
            // Create new user
            existingUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                image: (profile as any).picture,
                role: 'customer',
                emailVerified: new Date(),
              }
            });
          }

          // Return user object with DB info so jwt callback receives it
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            image: existingUser.image,
            role: existingUser.role,
          };
        } catch (error) {
          console.error('[Auth] Error in Google sign in:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in - user is available from the signIn callback return value
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role;
        token.picture = user.image;
      }

      // For Google login, fetch from DB to ensure we have latest data
      if (account?.provider === 'google' && token.email && !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      // Handle session update (for client-side session sync)
      if (trigger === "update" && session) {
        token.id = (session.user as any)?.id || token.id;
      }

      return token;
    },

    async session({ session, token }) {
      // Add token info to session
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  // Debug mode only in development
  debug: process.env.NODE_ENV === "development",
});
