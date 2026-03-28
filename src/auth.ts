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
            // Set user data for token
            user.id = existingUser.id;
            (user as any).role = existingUser.role;
          } else {
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                image: (profile as any).picture,
                role: 'customer',
                emailVerified: new Date(),
              }
            });
            user.id = newUser.id;
            (user as any).role = newUser.role;
          }

          return true;
        } catch (error) {
          console.error('[Auth] Error in Google sign in:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // On initial sign in, add user info to token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;

        // For Google OAuth without database lookup in signIn callback
        if (account?.provider === 'google' && !token.role) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true }
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        }
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
