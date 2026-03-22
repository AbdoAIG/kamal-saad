import { auth } from "@/auth";

// Re-export auth function for server-side authentication
export { auth };

// For client-side usage
export const authOptions = {
  // This is kept for compatibility but auth() should be used on server side
};
