import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use Prisma adapter for database
  adapter: PrismaAdapter(prisma),
  
  // Secret for signing cookies
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  
  // Trust the host in production
  trustHost: true,
  
  // Use JWT sessions (simpler for OAuth)
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
      // Allow linking existing accounts by email
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
    async jwt({ token, user }) {
      // On initial sign in, add user info to token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
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
  
  // Debug in development
  debug: process.env.NODE_ENV === "development",
});
